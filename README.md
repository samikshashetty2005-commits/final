# Interactive DNA Mutation Severity Prediction Sandbox

An independent AI/ML bioinformatics research sandbox and web application inspired by the landmark CADD research paper (*"CADD: predicting the deleteriousness of variants throughout the human genome"*).

The sandbox ingests real NCBI ClinVar variant records, trains a multi-class Logistic Regression classifier across 4 clinical significance categories, calculates a continuous **0–100 Mutation Severity Score**, simulates hypothetical sequence mutations, queries real genomic APIs, compares multiple variants, and presents a modern visual interactive interface.

> **Research & Educational Disclaimer**: This is an independent student AI/ML prototype designed for education and research. It is **NOT** the official CADD implementation and is **NOT a medical diagnostic system**.

---

## 🌟 Major Features

1. **Existing Variant Analysis**:
   - Accepts HGVS / VCF locus formats (e.g. `chr7:140453136 A>T` for BRAF V600E, `chr17:43044295 G>A` for BRCA1).
   - Validates coordinates and alleles.
   - Extracts real non-leaking numerical and categorical genomic features.
   - Computes class probabilities and 0–100 Mutation Severity Score.
   - Queries real biological annotation resources (MyVariant.info REST API & ClinVar records).

2. **Hypothetical DNA Mutation Simulator**:
   - User inputs original DNA nucleotide sequence (e.g., `ATGCGTACGTA`), mutation position, original base, and new base.
   - Highlights mutated nucleotides in sequence context.
   - Translates original vs mutated DNA codons into protein amino acid sequences.
   - Identifies molecular consequence category (synonymous, missense, nonsense, frameshift, insertion, deletion).
   - Passes simulated variant through ML pipeline for severity scoring.

3. **"What could this mutation mean?" Biological Interpretation**:
   - Generates contextual explanations grounded in model class probabilities and verified consequence annotations.
   - Clearly distinguishes model probabilistic prediction from confirmed biological effect.

4. **Multiple Mutation Comparison & Severity Ranking**:
   - Enables side-by-side comparison of 3 or more genetic variants.
   - Renders a comparative matrix table (Locus, Significance, Severity, Confidence, Gene).
   - Ranks variants from highest to lowest severity score.

5. **ClinVar Dataset & ML Evaluation Dashboard**:
   - Displays real NCBI ClinVar dataset statistics (100,000 balanced records).
   - Displays test set evaluation metrics (Accuracy, Macro/Weighted Precision, Recall, F1-Score).
   - Interactive 4x4 Confusion Matrix grid.

---

## 🧬 Machine Learning & Data Pipeline

### Real ClinVar Dataset
- **Source**: NCBI ClinVar Release Feed (`variant_summary.txt.gz`)
- **Assembly**: GRCh38 (hg38)
- **Target Classes (4 Categories)**:
  1. `Pathogenic`
  2. `Likely pathogenic`
  3. `Likely benign`
  4. `Benign`
- **Cleaning & Balancing**: Filtered assembly, cleaned chromosome names, extracted VCF coordinates and alleles (`PositionVCF`, `ReferenceAlleleVCF`, `AlternateAlleleVCF`), deduplicated coordinates, and applied reproducible stratified sampling (25,000 records per class = 100,000 total real ClinVar variants).

### Feature Engineering (Non-Leaking)
- **Numeric**: Genomic VCF position, Reference allele length, Alternate allele length, Length difference (`alt_len - ref_len`), Reference GC content ratio, Alternate GC content ratio, GC difference (`gc_diff`), SNV indicator (`is_snv`), Deletion indicator (`is_deletion`), Insertion indicator (`is_insertion`).
- **Categorical**: Chromosome (`chr1`-`chr22`, `chrX`, `chrY`, `chrM`), Variant Type (`single nucleotide variant`, `deletion`, `insertion`, `indel`), Transition/Transversion indicator (`is_transition`), Gene Symbol frequency encoding (`gene`).

### Model Architecture
- **Algorithm**: HistGradientBoosting Classifier (XGBoost-style, `max_iter=300`, `learning_rate=0.08`, `random_state=42`)
- **Preprocessing**: `ColumnTransformer` with `StandardScaler` for numeric features and `OneHotEncoder` for categorical features inside a `scikit-learn` `Pipeline`.
- **Artifacts Saved**: `backend/model.joblib`, `backend/dataset_info.json`, `backend/clinvar_lookup.json`.

---

## 📊 Mutation Severity Score Calculation (0–100)

The Mutation Severity Score is derived from the model's class probability outputs:

$$
\text{Severity Score} = 100 \times \Big( 1.0 \cdot P(\text{Pathogenic}) + 0.75 \cdot P(\text{Likely pathogenic}) + 0.25 \cdot P(\text{Likely benign}) + 0.0 \cdot P(\text{Benign}) \Big)
$$

### Score Visualization Thresholds
- **0–25**: Low Severity
- **26–50**: Moderate Severity
- **51–75**: High Severity
- **76–100**: Very High Severity

*(Note: These thresholds are project-specific visualization thresholds and not clinical diagnostic thresholds.)*

---

## 📁 Project Architecture

```text
mutation-prediction/
├── backend/
│   ├── main.py              # FastAPI server routes (/predict, /simulate, /compare, /dataset-info, /model-info)
│   ├── model.py             # Predictor engine, 0-100 severity calculation & explanations
│   ├── preprocessing.py     # String parsing, codon translation table & biological API lookups
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # React visual dashboard (5 main tabs)
│   │   ├── App.css          # Glassmorphic dark styling & responsive grid layout
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json         # React + Vite dependencies
├── data/
│   └── README.md            # ClinVar dataset documentation
├── train_model.py           # Ingests ClinVar data, trains LogisticRegression & exports artifacts
├── README.md                # Project documentation
└── .gitignore
```

---

## 🚀 How to Run the Application

### Step 1: Install Python Dependencies & Train Model
```bash
pip install -r backend/requirements.txt
python train_model.py
```

### Step 2: Start Backend API Server
```bash
python -m uvicorn backend.main:app --reload --port 8000
```
Backend Swagger API Docs will be available at: `http://localhost:8000/docs`

### Step 3: Install & Start React Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend interface will be available at: `http://localhost:5173`

---

## 🔬 Limitations & Future Work

1. **Feature Scope**: Current model uses positional, sequence-length, GC content, and variant type attributes. Incorporating conservation scores (PhyloP/Gerp++) and structural impact features would further improve accuracy.
2. **External API Latency**: Real-time MyVariant.info queries depend on network availability; fallback offline lookup from ClinVar database is enabled.
3. **Not a Clinical Tool**: This system is created strictly for academic research and educational demonstration.
