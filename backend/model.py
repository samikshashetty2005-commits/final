import os
import json
import joblib
import numpy as np
import pandas as pd
from backend.preprocessing import (
    prepare_feature_dataframe,
    fetch_real_annotations,
    parse_variant_string,
    validate_nucleotides
)

BACKEND_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BACKEND_DIR, "model.joblib")
DATASET_INFO_PATH = os.path.join(BACKEND_DIR, "dataset_info.json")
LOOKUP_PATH = os.path.join(BACKEND_DIR, "clinvar_lookup.json")

class MutationPredictor:
    def __init__(self):
        self.model = None
        self.dataset_info = {}
        self.clinvar_lookup = {}
        self.load_artifacts()

    def load_artifacts(self):
        if os.path.exists(MODEL_PATH):
            self.model = joblib.load(MODEL_PATH)
            print(f"Loaded ML model pipeline from {MODEL_PATH}")
        else:
            print(f"WARNING: Model file not found at {MODEL_PATH}")
            
        if os.path.exists(DATASET_INFO_PATH):
            with open(DATASET_INFO_PATH, 'r', encoding='utf-8') as f:
                self.dataset_info = json.load(f)
            print(f"Loaded dataset info from {DATASET_INFO_PATH}")

        if os.path.exists(LOOKUP_PATH):
            with open(LOOKUP_PATH, 'r', encoding='utf-8') as f:
                self.clinvar_lookup = json.load(f)
            print(f"Loaded {len(self.clinvar_lookup)} ClinVar lookup records.")

    def calculate_severity_score(self, class_probabilities):
        """
        Calculates 0-100 Mutation Severity Score based on weighted class probabilities:
        - Pathogenic: weight 1.0
        - Likely pathogenic: weight 0.75
        - Likely benign: weight 0.25
        - Benign: weight 0.0
        """
        classes = list(self.model.classes_)
        prob_dict = dict(zip(classes, class_probabilities))
        
        p_pathogenic = prob_dict.get("Pathogenic", 0.0)
        p_likely_pathogenic = prob_dict.get("Likely pathogenic", 0.0)
        p_likely_benign = prob_dict.get("Likely benign", 0.0)
        p_benign = prob_dict.get("Benign", 0.0)
        
        weighted_val = (1.0 * p_pathogenic) + (0.75 * p_likely_pathogenic) + (0.25 * p_likely_benign) + (0.0 * p_benign)
        score = round(float(weighted_val * 100.0), 1)
        
        if score <= 25.0:
            level = "Low"
        elif score <= 50.0:
            level = "Moderate"
        elif score <= 75.0:
            level = "High"
        else:
            level = "Very High"
            
        return score, level, {
            "Pathogenic": round(float(p_pathogenic * 100), 1),
            "Likely pathogenic": round(float(p_likely_pathogenic * 100), 1),
            "Likely benign": round(float(p_likely_benign * 100), 1),
            "Benign": round(float(p_benign * 100), 1)
        }

    def generate_explanation(self, predicted_class, severity_score, severity_level, annotations, consequence_info=None):
        """
        Generates clean 'What could this mutation mean?' biological interpretation.
        """
        gene_name = annotations.get("gene", "Unannotated Gene")
        consequence = consequence_info or annotations.get("consequence", "Genomic Variant")
        
        explanation_lines = [
            f"The trained ClinVar Logistic Regression model predicts this variant belongs to the '{predicted_class}' class with a Mutation Severity Score of {severity_score}/100 ({severity_level} severity).",
            f"Associated Gene / Region: {gene_name}.",
            f"Molecular / Consequence Category: {consequence}."
        ]
        
        if predicted_class in ["Pathogenic", "Likely pathogenic"]:
            explanation_lines.append(
                "Biological Interpretation: This variant exhibits structural or positional features more consistent with deleterious variants documented in ClinVar than with benign variants. It may impact local gene function or transcript stability."
            )
        else:
            explanation_lines.append(
                "Biological Interpretation: This variant exhibits feature characteristics consistent with benign or likely benign clinical classifications in ClinVar, suggesting lower probability of causing severe functional disruption."
            )
            
        explanation_lines.append(
            "Scientific Disclaimer: Model prediction ≠ confirmed biological or clinical effect. This output is for research & educational demonstration only."
        )
        
        return " ".join(explanation_lines)

    def predict_variant(self, chrom, pos, ref, alt, var_type=None):
        if self.model is None:
            raise RuntimeError("Model artifact is not loaded. Please run train_model.py first.")
            
        # Validate canonical DNA bases (A, C, G, T, -)
        is_canonical, warning_msg = validate_nucleotides(ref, alt)
        if not is_canonical:
            raise ValueError(warning_msg)
            
        # Real annotations
        annotations = fetch_real_annotations(chrom, pos, ref, alt, self.clinvar_lookup)
        gene_symbol = annotations.get("gene", "Unknown") if annotations else "Unknown"
        hgvs_name = annotations.get("hgvs_name", "") if annotations else ""
        consequence = annotations.get("consequence", "") if annotations else ""

        df_feat = prepare_feature_dataframe(
            chrom, pos, ref, alt, var_type=var_type, gene=gene_symbol, hgvs_name=hgvs_name, consequence=consequence
        )
        
        # Predict class & probabilities
        probs = self.model.predict_proba(df_feat)[0]
        classes = list(self.model.classes_)

        # Integrate verified ClinVar ground-truth if present
        clin_sig = annotations.get("clinical_significance") if annotations else None
        if clin_sig in ["Pathogenic", "Likely pathogenic", "Likely benign", "Benign"]:
            gt_vec = np.array([1.0 if c == clin_sig else 0.0 for c in classes])
            probs = 0.4 * probs + 0.6 * gt_vec
            probs = probs / np.sum(probs)

        pred_idx = np.argmax(probs)
        pred_class = classes[pred_idx]
        confidence = round(float(probs[pred_idx] * 100), 1)
        
        # Severity score
        score, level, prob_breakdown = self.calculate_severity_score(probs)
        
        # Explanation
        explanation = self.generate_explanation(pred_class, score, level, annotations)
        
        return {
            "variant": f"{chrom}:{pos} {ref}>{alt}",
            "chromosome": chrom,
            "position": pos,
            "reference_allele": ref,
            "alternate_allele": alt,
            "predicted_class": pred_class,
            "severity_score": score,
            "severity_level": level,
            "confidence_percentage": confidence,
            "class_probabilities": prob_breakdown,
            "annotations": annotations,
            "explanation": explanation,
            "is_canonical_dna": is_canonical,
            "warning": warning_msg
        }

predictor_instance = MutationPredictor()
