import re
import requests
import json
import os
import pandas as pd
import numpy as np

# Standard Genetic Code Dictionary for DNA codon translation
CODON_TABLE = {
    'ATA':'I', 'ATC':'I', 'ATT':'I', 'ATG':'M',
    'ACA':'T', 'ACC':'T', 'ACG':'T', 'ACT':'T',
    'AAC':'N', 'AAT':'N', 'AAA':'K', 'AAG':'K',
    'AGC':'S', 'AGT':'S', 'AGA':'R', 'AGG':'R',
    'CTA':'L', 'CTC':'L', 'CTG':'L', 'CTT':'L',
    'CCA':'P', 'CCC':'P', 'CCG':'P', 'CCT':'P',
    'CAC':'H', 'CAT':'H', 'CAA':'Q', 'CAG':'Q',
    'CGA':'R', 'CGC':'R', 'CGG':'R', 'CGT':'R',
    'GTA':'V', 'GTC':'V', 'GTG':'V', 'GTT':'V',
    'GCA':'A', 'GCC':'A', 'GCG':'A', 'GCT':'A',
    'GAC':'D', 'GAT':'D', 'GAA':'E', 'GAG':'E',
    'GGA':'G', 'GGC':'G', 'GGG':'G', 'GGT':'G',
    'TCA':'S', 'TCC':'S', 'TCG':'S', 'TCT':'S',
    'TTC':'F', 'TTT':'F', 'TTA':'L', 'TTG':'L',
    'TAC':'Y', 'TAT':'Y', 'TAA':'*', 'TAG':'*', 'TGA':'*'
}

AMINO_ACID_NAMES = {
    'A': 'Alanine', 'R': 'Arginine', 'N': 'Asparagine', 'D': 'Aspartic acid',
    'C': 'Cysteine', 'Q': 'Glutamine', 'E': 'Glutamic acid', 'G': 'Glycine',
    'H': 'Histidine', 'I': 'Isoleucine', 'L': 'Leucine', 'K': 'Lysine',
    'M': 'Methionine', 'F': 'Phenylalanine', 'P': 'Proline', 'S': 'Serine',
    'T': 'Threonine', 'W': 'Tryptophan', 'Y': 'Tyrosine', 'V': 'Valine',
    '*': 'Stop Codon'
}

CANONICAL_DNA_BASES = set('ACGT-')

def validate_nucleotides(ref, alt):
    """
    Validates whether ref and alt alleles contain canonical DNA bases (A, C, G, T, -).
    Returns (is_canonical, warning_message).
    """
    ref_upper = str(ref).upper()
    alt_upper = str(alt).upper()
    
    invalid_ref = [c for c in ref_upper if c not in CANONICAL_DNA_BASES]
    invalid_alt = [c for c in alt_upper if c not in CANONICAL_DNA_BASES]
    
    invalid_chars = sorted(list(set(invalid_ref + invalid_alt)))
    
    if invalid_chars:
        invalid_str = ", ".join(f"'{c}'" for c in invalid_chars)
        warning_msg = (
            f"Invalid non-canonical nucleotide base(s) detected: {invalid_str}. "
            "Genomic DNA alleles must consist strictly of canonical bases (A, C, G, T)."
        )
        return False, warning_msg
        
    return True, None

def parse_variant_string(variant_str):
    """
    Parses strings like 'chr7:140453136 A>T' or '7:140453136 A>T' or 'chr7:140453136:A:T'
    """
    variant_str = variant_str.strip()
    
    # Format: chr7:140453136 A>T or 7:140453136 A>T
    m1 = re.match(r'^(?:chr)?([0-9]{1,2}|X|Y|MT|M):(\d+)\s+([A-Za-z\-]+)>([A-Za-z\-]+)$', variant_str, re.IGNORECASE)
    if m1:
        chrom, pos, ref, alt = m1.groups()
        chrom_str = f"chr{chrom.upper().replace('MT', 'M')}"
        return chrom_str, int(pos), ref.upper(), alt.upper()

    # Format: chr7:140453136:A:T
    m2 = re.match(r'^(?:chr)?([0-9]{1,2}|X|Y|MT|M):(\d+):([A-Za-z\-]+):([A-Za-z\-]+)$', variant_str, re.IGNORECASE)
    if m2:
        chrom, pos, ref, alt = m2.groups()
        chrom_str = f"chr{chrom.upper().replace('MT', 'M')}"
        return chrom_str, int(pos), ref.upper(), alt.upper()
        
    raise ValueError(f"Invalid variant format '{variant_str}'. Expected format like 'chr7:140453136 A>T' or '7:140453136 A/T'")

def calculate_gc_content(sequence):
    if not sequence or len(sequence) == 0:
        return 0.0
    sequence = str(sequence).upper()
    gc_count = sequence.count('G') + sequence.count('C')
    return float(gc_count) / len(sequence)

def is_transition_mut(ref, alt):
    ref = str(ref).upper()
    alt = str(alt).upper()
    if len(ref) == 1 and len(alt) == 1:
        purines = {'A', 'G'}
        pyrimidines = {'C', 'T'}
        if (ref in purines and alt in purines) or (ref in pyrimidines and alt in pyrimidines):
            return 1
    return 0

def infer_variant_type(ref, alt):
    ref = str(ref).upper()
    alt = str(alt).upper()
    if len(ref) == 1 and len(alt) == 1:
        return "single nucleotide variant"
    elif len(ref) > len(alt):
        return "deletion"
    elif len(alt) > len(ref):
        return "insertion"
    else:
        return "indel"
def extract_consequences_from_inputs(name_str, type_str, ref_str, alt_str):
    name_str = str(name_str)
    type_str = str(type_str).lower()
    ref_str = str(ref_str).upper()
    alt_str = str(alt_str).upper()
    
    is_essential_splice = 1 if re.search(r'c\.\d+[\+\-][12][A-Z>]', name_str) else 0
    is_intronic = 1 if (re.search(r'c\.\d+[\+\-]\d+', name_str) or 'intron' in type_str) else 0
    is_5utr = 1 if re.search(r'c\.\-\d+', name_str) else 0
    is_3utr = 1 if re.search(r'c\.\*\d+', name_str) else 0
    is_coding = 1 if 'p.' in name_str else 0
    is_synonymous = 1 if (re.search(r'p\.[A-Z][a-z]{2}\d+=', name_str) or '=' in name_str) else 0
    is_nonsense_frameshift = 1 if (re.search(r'p\.(?:Ter|\*|fs)', name_str) or 'frameshift' in type_str) else 0
    is_missense = 1 if (is_coding and not is_synonymous and not is_nonsense_frameshift) else 0
    is_duplication = 1 if ('dup' in name_str.lower() or 'duplication' in type_str) else 0
    is_deletion = 1 if ('del' in name_str.lower() or 'deletion' in type_str) else 0
    is_insertion = 1 if ('ins' in name_str.lower() or 'insertion' in type_str) else 0
    is_cistron_cpg = 1 if ((ref_str == 'C' and alt_str == 'T') or (ref_str == 'G' and alt_str == 'A')) else 0
    
    return {
        'is_essential_splice': is_essential_splice,
        'is_intronic': is_intronic,
        'is_5utr': is_5utr,
        'is_3utr': is_3utr,
        'is_coding': is_coding,
        'is_synonymous': is_synonymous,
        'is_nonsense_frameshift': is_nonsense_frameshift,
        'is_missense': is_missense,
        'is_duplication': is_duplication,
        'is_deletion_type': is_deletion,
        'is_insertion_type': is_insertion,
        'is_cistron_cpg': is_cistron_cpg
    }

# converting variant inputs into numerical features
def prepare_feature_dataframe(chrom, pos, ref, alt, var_type=None, gene="Unknown", hgvs_name=""):
    if var_type is None:
        var_type = infer_variant_type(ref, alt)
        
    chrom_str = chrom if str(chrom).startswith('chr') else f"chr{chrom}"
    ref_len = len(ref)
    alt_len = len(alt)
    ref_gc = calculate_gc_content(ref)
    alt_gc = calculate_gc_content(alt)
    
    gene_symbol = str(gene) if gene else 'Unknown'
    
    conseq_dict = extract_consequences_from_inputs(hgvs_name, var_type, ref, alt)
    
    feat_dict = {
        'position': float(pos),
        'ref_len': float(ref_len),
        'alt_len': float(alt_len),
        'len_diff': float(alt_len - ref_len),
        'ref_gc': ref_gc,
        'alt_gc': alt_gc,
        'gc_diff': float(alt_gc - ref_gc),
        'is_snv': 1 if (ref_len == 1 and alt_len == 1) else 0,
        'is_deletion': 1 if (ref_len > alt_len) else 0,
        'is_insertion': 1 if (alt_len > ref_len) else 0,
        'gene_count': 10.0 if gene_symbol != 'Unknown' else 1.0,
        'chromosome': str(chrom_str),
        'type': str(var_type).lower(),
        'is_transition': is_transition_mut(ref, alt),
        'gene': gene_symbol
    }
    feat_dict.update(conseq_dict)
    
    return pd.DataFrame([feat_dict])

def translate_sequence(dna_seq):
    dna_seq = dna_seq.upper().replace('U', 'T')
    amino_acids = []
    for i in range(0, len(dna_seq) - 2, 3):
        codon = dna_seq[i:i+3]
        aa = CODON_TABLE.get(codon, '?')
        amino_acids.append(aa)
    return ''.join(amino_acids)

def simulate_sequence_mutation(orig_seq, pos_1based, orig_base, new_base):
    orig_seq = orig_seq.upper().strip()
    orig_base = orig_base.upper().strip()
    new_base = new_base.upper().strip()
    
    # Validations
    for char in orig_seq:
        if char not in ['A', 'C', 'G', 'T']:
            raise ValueError(f"Invalid nucleotide '{char}' in original DNA sequence. Allowed bases: A, C, G, T.")
            
    if pos_1based < 1 or pos_1based > len(orig_seq):
        raise ValueError(f"Mutation position {pos_1based} is out of bounds for sequence of length {len(orig_seq)}.")
        
    idx = pos_1based - 1
    actual_base = orig_seq[idx]
    if actual_base != orig_base:
        raise ValueError(f"Reference base mismatch at position {pos_1based}: expected '{orig_base}', but found '{actual_base}' in sequence.")
        
    # Build mutated sequence
    if len(orig_base) == 1 and len(new_base) == 1:
        mutated_seq = orig_seq[:idx] + new_base + orig_seq[idx+1:]
        var_type = "substitution"
    elif new_base == "" or new_base == "-":
        mutated_seq = orig_seq[:idx] + orig_seq[idx+1:]
        var_type = "deletion"
    elif orig_base == "" or orig_base == "-":
        mutated_seq = orig_seq[:idx] + new_base + orig_seq[idx:]
        var_type = "insertion"
    else:
        mutated_seq = orig_seq[:idx] + new_base + orig_seq[idx+len(orig_base):]
        var_type = "indel"

    # Analyze Codon Consequence
    orig_protein = translate_sequence(orig_seq)
    mutated_protein = translate_sequence(mutated_seq)
    
    codon_idx = idx // 3
    orig_codon = orig_seq[codon_idx*3 : codon_idx*3 + 3]
    mut_codon = mutated_seq[codon_idx*3 : codon_idx*3 + 3]
    
    orig_aa = CODON_TABLE.get(orig_codon, '?')
    mut_aa = CODON_TABLE.get(mut_codon, '?')
    
    if len(orig_base) != len(new_base):
        consequence_type = "frameshift"
    elif orig_aa == mut_aa:
        consequence_type = "synonymous (silent)"
    elif mut_aa == '*':
        consequence_type = "nonsense (stop gain)"
    elif orig_aa == '*':
        consequence_type = "stop lost"
    else:
        consequence_type = "missense (amino acid change)"
        
    return {
        "original_sequence": orig_seq,
        "mutated_sequence": mutated_seq,
        "position": pos_1based,
        "original_base": orig_base,
        "new_base": new_base,
        "mutation_type": var_type,
        "original_codon": orig_codon,
        "mutated_codon": mut_codon,
        "original_amino_acid": f"{orig_aa} ({AMINO_ACID_NAMES.get(orig_aa, 'Unknown')})",
        "mutated_amino_acid": f"{mut_aa} ({AMINO_ACID_NAMES.get(mut_aa, 'Unknown')})",
        "original_protein": orig_protein,
        "mutated_protein": mutated_protein,
        "predicted_consequence": consequence_type
    }

def fetch_real_annotations(chrom, pos, ref, alt, clinvar_lookup=None):
    """
    Fetches real annotations from local ClinVar lookup and external MyVariant.info API.
    Does NOT invent fake annotations.
    """
    annotations = {
        "gene": "Unknown / Unannotated Region",
        "transcript": "Unavailable",
        "consequence": "Genomic Variant",
        "allele_frequency": "Unavailable",
        "variation_id": "N/A",
        "hgvs_name": "N/A",
        "annotation_source": "Local ClinVar DB & MyVariant.info REST API",
        "is_real_data": True,
        "api_status": "Checked"
    }
    
    key = f"{chrom}:{pos}:{ref}>{alt}"
    
    # 1. Local ClinVar match
    if clinvar_lookup and key in clinvar_lookup:
        entry = clinvar_lookup[key]
        annotations["gene"] = entry.get("gene", annotations["gene"])
        annotations["variation_id"] = entry.get("variation_id", annotations["variation_id"])
        annotations["hgvs_name"] = entry.get("hgvs_name", annotations["hgvs_name"])
        annotations["consequence"] = f"ClinVar {entry.get('type', 'Variant')}"
        annotations["annotation_source"] = "ClinVar Verified Record (Local Database)"
        return annotations
        
    # 2. Try MyVariant.info REST API
    try:
        clean_chrom = chrom.lower() if str(chrom).startswith('chr') else f"chr{chrom}"
        mv_id = f"{clean_chrom}:g.{pos}{ref}>{alt}"
        url = f"https://myvariant.info/v1/variant/{mv_id}"
        resp = requests.get(url, timeout=3)
        if resp.status_code == 200:
            data = resp.json()
            cadd = data.get('cadd', {})
            clinvar_info = data.get('clinvar', {})
            dbsnp = data.get('dbsnp', {})
            
            if isinstance(cadd, dict) and cadd.get('gene'):
                annotations["gene"] = cadd.get('gene', {}).get('genename', annotations["gene"])
                annotations["consequence"] = cadd.get('consequence', annotations["consequence"])
            elif isinstance(clinvar_info, dict) and clinvar_info.get('gene'):
                annotations["gene"] = clinvar_info.get('gene', {}).get('symbol', annotations["gene"])
                
            if isinstance(dbsnp, dict) and dbsnp.get('rsid'):
                annotations["hgvs_name"] = f"dbSNP: {dbsnp.get('rsid')}"
                
            if isinstance(cadd, dict) and cadd.get('maf'):
                annotations["allele_frequency"] = str(cadd.get('maf'))
                
            annotations["annotation_source"] = "MyVariant.info Real Genomic API"
    except Exception as e:
        annotations["api_status"] = f"External API Offline/Unreachable ({str(e)})"
        
    return annotations
