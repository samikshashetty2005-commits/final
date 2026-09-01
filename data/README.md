# ClinVar Dataset Directory

This directory contains information and cached metadata for the ClinVar dataset downloaded from NCBI.

- Source: [NCBI ClinVar FTP](https://ftp.ncbi.nlm.nih.gov/pub/clinvar/tab_delimited/variant_summary.txt.gz)
- Target Classes:
  - Pathogenic
  - Likely pathogenic
  - Benign
  - Likely benign
- Assembly: GRCh38 (hg38)

The data ingestion script (`train_model.py`) fetches real variant records, filters assembly and target clinical significance categories, deduplicates, and creates a balanced stratified training/testing dataset.
