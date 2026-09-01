import React, { useState, useEffect } from 'react';
import { 
  Dna, 
  Activity, 
  Layers, 
  BarChart3, 
  Info, 
  Search, 
  Play, 
  GitCompare, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Database,
  Cpu,
  FileText,
  FlaskConical,
  Sparkles
} from 'lucide-react';

const PROB_COLORS = {
  'Pathogenic': '#ef4444',
  'Likely pathogenic': '#f97316',
  'Likely benign': '#0ea5e9',
  'Benign': '#10b981'
};

const PRESET_VARIANTS = [
  { label: 'BRAF V600E', val: 'chr7:140453136 A>T' },
  { label: 'BRCA1 c.4304G>A', val: 'chr17:43044295 G>A' },
  { label: 'BRCA2 c.32315474C>T', val: 'chr13:32315474 C>T' },
  { label: 'TP53 c.524G>A', val: 'chr17:7675088 C>T' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  // Existing Variant state
  const [variantInput, setVariantInput] = useState('chr7:140453136 A>T');
  const [predictResult, setPredictResult] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState(null);

  // Simulation state
  const [simSeq, setSimSeq] = useState('ATGCGTACGTA');
  const [simPos, setSimPos] = useState(3);
  const [simOrigBase, setSimOrigBase] = useState('G');
  const [simNewBase, setSimNewBase] = useState('A');
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState(null);

  // Compare state
  const [compVariants, setCompVariants] = useState([
    'chr7:140453136 A>T',
    'chr17:43044295 G>A',
    'chr13:32315474 C>T'
  ]);
  const [compResult, setCompResult] = useState(null);
  const [compLoading, setCompLoading] = useState(false);
  const [compError, setCompError] = useState(null);

  // Dataset & Model Info state
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);

  useEffect(() => {
    fetch('/api/dataset-info')
      .then(res => res.json())
      .then(data => setDatasetInfo(data))
      .catch(err => console.error('Dataset info fetch error:', err));

    fetch('/api/model-info')
      .then(res => res.json())
      .then(data => setModelInfo(data))
      .catch(err => console.error('Model info fetch error:', err));
  }, []);

  const handlePredict = async (e, customInput) => {
    if (e) e.preventDefault();
    const query = customInput || variantInput;
    if (!query) return;

    setPredictLoading(true);
    setPredictError(null);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant_string: query })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Prediction failed');
      setPredictResult(data);
    } catch (err) {
      setPredictResult(null);
      setPredictError(err.message);
    } finally {
      setPredictLoading(false);
    }
  };

  const handleSimulate = async (e) => {
    if (e) e.preventDefault();
    setSimLoading(true);
    setSimError(null);
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_sequence: simSeq,
          position: parseInt(simPos, 10),
          original_base: simOrigBase,
          new_base: simNewBase
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Simulation failed');
      setSimResult(data);
    } catch (err) {
      setSimError(err.message);
    } finally {
      setSimLoading(false);
    }
  };

  const handleCompare = async (e) => {
    if (e) e.preventDefault();
    setCompLoading(true);
    setCompError(null);
    try {
      const variantsPayload = compVariants
        .filter(v => v.trim().length > 0)
        .map(v => ({ variant_string: v.trim() }));

      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variants: variantsPayload })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Comparison failed');
      setCompResult(data);
    } catch (err) {
      setCompError(err.message);
    } finally {
      setCompLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-group">
          <div className="logo-icon-box">
            <FlaskConical size={22} />
          </div>
          <div>
            <h1 className="logo-title">ClinVar Variant Explorer</h1>
            <p className="logo-subtitle">Genomic Mutation Severity & Pathogenicity Classifier</p>
          </div>
        </div>

        <nav className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <Info size={16} /> Home
          </button>
          <button 
            className={`nav-tab ${activeTab === 'analyze' ? 'active' : ''}`}
            onClick={() => setActiveTab('analyze')}
          >
            <Search size={16} /> Analyze Variant
          </button>
          <button 
            className={`nav-tab ${activeTab === 'simulate' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulate')}
          >
            <Play size={16} /> Sequence Simulator
          </button>
          <button 
            className={`nav-tab ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => setActiveTab('compare')}
          >
            <GitCompare size={16} /> Multi-Compare
          </button>
          <button 
            className={`nav-tab ${activeTab === 'dataset' ? 'active' : ''}`}
            onClick={() => setActiveTab('dataset')}
          >
            <BarChart3 size={16} /> ClinVar Metrics
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main>

        {/* 1. HOME TAB */}
        {activeTab === 'home' && (
          <div>
            {/* Hero Panel */}
            <div className="hero-panel">
              <div style={{ maxWidth: '850px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <span className="badge badge-Likely-benign">NCBI ClinVar GRCh38 Pipeline</span>
                  <span className="badge badge-Benign">
                    {datasetInfo?.total_records_ingested ? datasetInfo.total_records_ingested.toLocaleString() : '100,000'} Balanced Records
                  </span>
                  <span className="badge badge-Likely-pathogenic">CADD Architecture Inspired</span>
                  <span className="badge badge-Pathogenic">4-Class Pathogenicity Model</span>
                </div>

                <h1 style={{ fontSize: '2.1rem', fontWeight: 800, marginBottom: '14px', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                  Interactive DNA Mutation Severity & Pathogenicity Platform
                </h1>

                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '24px' }}>
                  A clinical-grade bioinformatics platform engineered for predicting genomic variant deleteriousness across {datasetInfo?.total_records_ingested ? datasetInfo.total_records_ingested.toLocaleString() : '100,000'} curated NCBI ClinVar records, simulating sequence nucleotide edits, translating codons into protein amino acid chains, and ranking multi-variant severity.
                </p>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button className="btn-primary" onClick={() => setActiveTab('analyze')}>
                    Analyze Existing Variant <ArrowRight size={16} />
                  </button>
                  <button className="btn-secondary" onClick={() => setActiveTab('simulate')}>
                    <Play size={16} /> Open Sequence Simulator
                  </button>
                  <button className="btn-secondary" onClick={() => setActiveTab('dataset')}>
                    <BarChart3 size={16} /> View ClinVar Metrics
                  </button>
                </div>
              </div>

              {/* Hero Stats Cards */}
              <div className="hero-stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{datasetInfo?.total_records_ingested ? datasetInfo.total_records_ingested.toLocaleString() : '100,000'}</div>
                  <div className="stat-label">Ingested ClinVar Variants</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">4 Classes</div>
                  <div className="stat-label">Equal 25% Balance</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">0 – 100</div>
                  <div className="stat-label">Continuous Severity Index</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">Strict ATCG</div>
                  <div className="stat-label">Allele Enforcement</div>
                </div>
              </div>
            </div>

            {/* Sample Variant Quick Launch Section */}
            <div className="panel">
              <div className="panel-header">
                <Search className="panel-icon" size={20} />
                <h3 className="panel-title">Sample Genomic Loci Quick Launch</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '16px' }}>
                Click any clinically significant locus card below to run real-time pathogenicity classification and query live gene annotations:
              </p>

              <div className="sample-grid">
                {PRESET_VARIANTS.map((p) => (
                  <div 
                    key={p.label} 
                    className="sample-card"
                    onClick={() => {
                      setVariantInput(p.val);
                      setActiveTab('analyze');
                      handlePredict(null, p.val);
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span className="badge badge-Pathogenic" style={{ fontSize: '0.7rem' }}>Clinical Locus</span>
                        <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
                      </div>
                      <h4 style={{ fontSize: '1.02rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>{p.label}</h4>
                      <code style={{ fontSize: '0.84rem', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{p.val}</code>
                    </div>
                    <div style={{ marginTop: '16px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Analyze Variant <ArrowRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* End-to-End Pipeline Architecture Section */}
            <div className="panel">
              <div className="panel-header">
                <Cpu className="panel-icon" size={20} />
                <h3 className="panel-title">End-to-End Pipeline Architecture</h3>
              </div>
              <div className="pipeline-list">
                <div className="pipeline-item">
                  <div className="pipeline-step-num">1</div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '2px' }}>NCBI ClinVar Streaming & Class Balancing</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Parses GRCh38 ClinVar summaries, filters canonical assemblies, and constructs a balanced {datasetInfo?.total_records_ingested ? datasetInfo.total_records_ingested.toLocaleString() : '100,000'} sample dataset across Pathogenic, Likely Pathogenic, Likely Benign, and Benign classes.
                    </p>
                  </div>
                </div>

                <div className="pipeline-item">
                  <div className="pipeline-step-num">2</div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '2px' }}>Leak-Free Bioinformatics Feature Extraction</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Computes genomic locus features including chromosome position, GC content ratio, allele length difference, and transition vs. transversion nucleotide replacement status.
                    </p>
                  </div>
                </div>

                <div className="pipeline-item">
                  <div className="pipeline-step-num">3</div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '2px' }}>Ensemble Machine Learning Pipeline</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Uses a Scikit-learn Pipeline incorporating StandardScaler, OneHotEncoder, and an ensemble classifier trained without data leakage on 80% train / 20% test splits.
                    </p>
                  </div>
                </div>

                <div className="pipeline-item">
                  <div className="pipeline-step-num">4</div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '2px' }}>Continuous 0–100 Severity Index & Strict ATCG Base Validation</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Calculates a continuous risk score from class probability vectors while validating nucleotide inputs against canonical ATCG bases to suppress invalid outputs.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Capabilities Grid */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-main)' }}>
                Platform Modules & Scientific Analysis Tools
              </h3>

              <div className="feature-grid">
                <div className="feature-card">
                  <div className="feature-icon-box">
                    <Search size={22} />
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>Existing Variant Analysis</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5' }}>
                    Accepts HGVS & VCF locus coordinates (e.g., <code>chr7:140453136 A&gt;T</code>). Computes positional GC content, variant length delta, transition/transversion, and generates a 0–100 Severity Index.
                  </p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon-box">
                    <Play size={22} />
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>Hypothetical Mutation Simulator</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5' }}>
                    Input custom DNA nucleotide sequences, specify edit positions, and analyze codon changes. Translates codons into protein amino acid chains and identifies molecular consequences.
                  </p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon-box">
                    <GitCompare size={22} />
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>Multi-Variant Comparison</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5' }}>
                    Enables side-by-side comparison of multiple genetic variants in a matrix. Ranks variants from highest to lowest severity score to prioritize candidate mutations in research workflows.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ANALYZE VARIANT TAB */}
        {activeTab === 'analyze' && (
          <div>
            <div className="panel">
              <div className="panel-header">
                <Search className="panel-icon" size={20} />
                <h2 className="panel-title">Analyze Existing Genetic Variant</h2>
              </div>

              <form onSubmit={handlePredict}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Variant Locus (HGVS / VCF Format)</label>
                  <input 
                    type="text" 
                    className="form-input"
                    style={{ fontFamily: 'var(--font-mono)' }}
                    placeholder="e.g. chr7:140453136 A>T or chr17:43044295 G>A" 
                    value={variantInput}
                    onChange={(e) => setVariantInput(e.target.value)}
                  />

                  {/* Preset Buttons */}
                  <div className="preset-group">
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick Presets:</span>
                    {PRESET_VARIANTS.map((p) => (
                      <button 
                        key={p.label}
                        type="button"
                        className="preset-chip"
                        onClick={() => {
                          setVariantInput(p.val);
                          handlePredict(null, p.val);
                        }}
                      >
                        {p.label} (<code>{p.val}</code>)
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={predictLoading}>
                  {predictLoading ? 'Calculating Prediction...' : 'Analyze Variant'}
                </button>
              </form>

              {predictError && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 500, lineHeight: '1.4' }}>{predictError}</span>
                </div>
              )}
            </div>

            {predictResult && (
              <div className="panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Genomic Locus</span>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{predictResult.variant}</h2>
                  </div>
                  <span className={`badge badge-${predictResult.predicted_class.replace(/\s+/g, '-')}`}>
                    {predictResult.predicted_class}
                  </span>
                </div>

                {/* Score Card */}
                <div className="severity-card" style={{ marginBottom: '24px' }}>
                  <div className="severity-score-display">
                    <div className="severity-number">{predictResult.severity_score}</div>
                    <div className="severity-label">Severity Score (0–100)</div>
                  </div>

                  <div className="severity-info-meta">
                    <div className={`severity-level-text level-${predictResult.severity_level.replace(/\s+/g, '-')}`}>
                      {predictResult.severity_level} Severity Rating
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Assigned Class: <strong>{predictResult.predicted_class}</strong> &bull; Model Confidence: <strong>{predictResult.confidence_percentage}%</strong>
                    </p>
                  </div>
                </div>

                {/* Class Probabilities */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Predicted Pathogenicity Class Probabilities
                  </h4>
                  <div className="prob-bar-group">
                    {Object.entries(predictResult.class_probabilities).map(([cls, prob]) => (
                      <div key={cls} className="prob-row">
                        <div className="prob-labels">
                          <span>{cls}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{prob}%</span>
                        </div>
                        <div className="prob-track-bg">
                          <div 
                            className="prob-track-fill" 
                            style={{ 
                              width: `${prob}%`, 
                              backgroundColor: PROB_COLORS[cls] || 'var(--accent-primary)' 
                            }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Biological Explanation */}
                <div className="notice-box">
                  <h4>What could this mutation mean?</h4>
                  <p>{predictResult.explanation}</p>
                </div>

                {/* Annotations */}
                {predictResult.annotations && (
                  <div>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                      Real Biological Annotations
                    </h4>
                    <table className="data-table">
                      <tbody>
                        <tr>
                          <th>Associated Gene</th>
                          <td><strong>{predictResult.annotations.gene}</strong></td>
                        </tr>
                        <tr>
                          <th>Consequence Category</th>
                          <td>{predictResult.annotations.consequence}</td>
                        </tr>
                        <tr>
                          <th>Variation Identifier</th>
                          <td>{predictResult.annotations.hgvs_name}</td>
                        </tr>
                        <tr>
                          <th>Annotation Source</th>
                          <td>{predictResult.annotations.annotation_source}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. SIMULATE SEQUENCE TAB */}
        {activeTab === 'simulate' && (
          <div>
            <div className="panel">
              <div className="panel-header">
                <Play className="panel-icon" size={20} />
                <h2 className="panel-title">Hypothetical DNA Mutation Simulator</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px' }}>
                Enter an original DNA sequence, specify the mutation position and base edit to observe codon translation, amino acid consequence, and ML model severity scoring.
              </p>

              <form onSubmit={handleSimulate}>
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Original DNA Sequence</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ fontFamily: 'var(--font-mono)' }}
                      value={simSeq}
                      onChange={(e) => setSimSeq(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Position (1-based)</label>
                    <input 
                      type="number" 
                      className="form-input"
                      value={simPos}
                      onChange={(e) => setSimPos(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Original Base</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      maxLength={5}
                      value={simOrigBase}
                      onChange={(e) => setSimOrigBase(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Base</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      maxLength={5}
                      value={simNewBase}
                      onChange={(e) => setSimNewBase(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={simLoading}>
                  {simLoading ? 'Simulating...' : 'Analyze Sequence Mutation'}
                </button>
              </form>

              {simError && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 500, lineHeight: '1.4' }}>{simError}</span>
                </div>
              )}
            </div>

            {simResult && (
              <div className="panel">
                <div className="panel-header">
                  <Dna className="panel-icon" size={20} />
                  <h3 className="panel-title">Sequence Mutation Alignment & Consequence</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label className="form-label" style={{ marginBottom: '6px' }}>Original DNA</label>
                    <div className="sequence-box">
                      {simResult.simulation.original_sequence}
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ marginBottom: '6px' }}>
                      Mutated DNA (Pos {simResult.simulation.position} Highlighted)
                    </label>
                    <div className="sequence-box">
                      {simResult.simulation.mutated_sequence.split('').map((base, idx) => {
                        const isMut = (idx + 1) === simResult.simulation.position;
                        return (
                          <span key={idx} className={isMut ? 'base-mutated' : 'base-match'}>
                            {base}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <table className="data-table" style={{ marginBottom: '24px' }}>
                  <tbody>
                    <tr>
                      <th>Mutation Type</th>
                      <td><span className="badge badge-Likely-pathogenic">{simResult.simulation.mutation_type}</span></td>
                    </tr>
                    <tr>
                      <th>Codon Change</th>
                      <td><code>{simResult.simulation.original_codon}</code> &rarr; <code>{simResult.simulation.mutated_codon}</code></td>
                    </tr>
                    <tr>
                      <th>Amino Acid Translation</th>
                      <td>{simResult.simulation.original_amino_acid} &rarr; {simResult.simulation.mutated_amino_acid}</td>
                    </tr>
                    <tr>
                      <th>Predicted Consequence</th>
                      <td><strong>{simResult.simulation.predicted_consequence}</strong></td>
                    </tr>
                  </tbody>
                </table>

                {/* Score Card */}
                <div className="severity-card" style={{ marginBottom: '20px' }}>
                  <div className="severity-score-display">
                    <div className="severity-number">{simResult.prediction.severity_score}</div>
                    <div className="severity-label">Severity Score (0–100)</div>
                  </div>

                  <div className="severity-info-meta">
                    <div className={`severity-level-text level-${simResult.prediction.severity_level.replace(/\s+/g, '-')}`}>
                      {simResult.prediction.severity_level} Severity ({simResult.prediction.predicted_class})
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Model Confidence: <strong>{simResult.prediction.confidence_percentage}%</strong>
                    </p>
                  </div>
                </div>

                <div className="notice-box">
                  <h4>What could this mutation mean?</h4>
                  <p>{simResult.explanation}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. COMPARE VARIANTS TAB */}
        {activeTab === 'compare' && (
          <div>
            <div className="panel">
              <div className="panel-header">
                <GitCompare className="panel-icon" size={20} />
                <h2 className="panel-title">Multiple Mutation Severity Comparison</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '16px' }}>
                Compare up to 3 or more genetic variants side-by-side to evaluate and rank their relative deleteriousness scores.
              </p>

              <form onSubmit={handleCompare}>
                {compVariants.map((val, i) => (
                  <div key={i} className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label">Mutation {String.fromCharCode(65 + i)}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ fontFamily: 'var(--font-mono)' }}
                      value={val}
                      onChange={(e) => {
                        const copy = [...compVariants];
                        copy[i] = e.target.value;
                        setCompVariants(copy);
                      }}
                    />
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => setCompVariants([...compVariants, ''])}
                  >
                    + Add Variant Field
                  </button>

                  <button type="submit" className="btn-primary" disabled={compLoading}>
                    {compLoading ? 'Comparing...' : 'Compare Mutations'}
                  </button>
                </div>
              </form>

              {compError && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 500, lineHeight: '1.4' }}>{compError}</span>
                </div>
              )}
            </div>

            {compResult && (
              <div>
                <div className="panel">
                  <div className="panel-header">
                    <BarChart3 className="panel-icon" size={20} />
                    <h3 className="panel-title">Side-by-Side Matrix Comparison</h3>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Attribute</th>
                        {compResult.compared_results.map((r, i) => (
                          <th key={i}>{r.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th>Variant Locus</th>
                        {compResult.compared_results.map((r, i) => (
                          <td key={i}><code>{r.variant}</code></td>
                        ))}
                      </tr>
                      <tr>
                        <th>Predicted Significance</th>
                        {compResult.compared_results.map((r, i) => (
                          <td key={i}>
                            <span className={`badge badge-${(r.predicted_class || '').replace(/\s+/g, '-')}`}>
                              {r.predicted_class || 'N/A'}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <th>Severity Score (0–100)</th>
                        {compResult.compared_results.map((r, i) => (
                          <td key={i}>
                            <strong style={{ fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}>{r.severity_score}</strong> ({r.severity_level})
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <th>Model Confidence</th>
                        {compResult.compared_results.map((r, i) => (
                          <td key={i}>{r.confidence_percentage}%</td>
                        ))}
                      </tr>
                      <tr>
                        <th>Gene Symbol</th>
                        {compResult.compared_results.map((r, i) => (
                          <td key={i}><strong>{r.annotations?.gene || 'N/A'}</strong></td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <Activity className="panel-icon" size={20} />
                    <h3 className="panel-title">Severity Score Ranking (Highest to Lowest)</h3>
                  </div>
                  <div className="ranking-grid">
                    {compResult.severity_ranking.map((item) => (
                      <div key={item.rank} className="rank-card">
                        <div className={`rank-badge rank-${item.rank}`}>
                          #{item.rank}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.label}</div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                            {item.variant}
                          </div>
                          <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                            Score: <strong>{item.severity_score}</strong> ({item.severity_level} &bull; {item.predicted_class})
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. CLINVAR METRICS TAB */}
        {activeTab === 'dataset' && (
          <div>
            <div className="panel">
              <div className="panel-header">
                <Database className="panel-icon" size={20} />
                <h2 className="panel-title">ClinVar Dataset & Model Evaluation Dashboard</h2>
              </div>

              {datasetInfo ? (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    NCBI ClinVar Class Distribution (Balanced {datasetInfo.total_records_ingested ? datasetInfo.total_records_ingested.toLocaleString() : '100,000'} Records)
                  </h4>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Clinical Significance Class</th>
                        <th>Sample Count</th>
                        <th>Class Proportion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(datasetInfo.class_distribution || {}).map(([cls, count]) => (
                        <tr key={cls}>
                          <td><span className={`badge badge-${cls.replace(/\s+/g, '-')}`}>{cls}</span></td>
                          <td><strong>{count.toLocaleString()}</strong></td>
                          <td>25.0%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Loading dataset distribution metadata...</p>
              )}

              {modelInfo && modelInfo.metrics ? (
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Model Evaluation Metrics (Test Set = {datasetInfo?.total_records_ingested ? Math.round(datasetInfo.total_records_ingested * 0.2).toLocaleString() : '20,000'} Records)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ padding: '14px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Accuracy</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        {(modelInfo.metrics.accuracy * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div style={{ padding: '14px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Weighted F1</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        {(modelInfo.metrics.f1_weighted * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div style={{ padding: '14px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Macro Precision</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        {(modelInfo.metrics.precision_macro * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div style={{ padding: '14px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Macro Recall</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        {(modelInfo.metrics.recall_macro * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {modelInfo.confusion_matrix && (
                    <div>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        Test Set Confusion Matrix (4x4 Multiclass Grid)
                      </h4>
                      <table className="data-table" style={{ textAlign: 'center' }}>
                        <thead>
                          <tr>
                            <th>Actual \ Predicted</th>
                            {modelInfo.confusion_matrix.labels.map(l => <th key={l}>{l}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {modelInfo.confusion_matrix.matrix.map((row, rIdx) => (
                            <tr key={rIdx}>
                              <th style={{ textAlign: 'left' }}>{modelInfo.confusion_matrix.labels[rIdx]}</th>
                              {row.map((val, cIdx) => (
                                <td 
                                  key={cIdx} 
                                  style={{ 
                                    background: rIdx === cIdx ? 'rgba(37, 99, 235, 0.25)' : 'transparent',
                                    fontWeight: rIdx === cIdx ? 700 : 400
                                  }}
                                >
                                  {val}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
