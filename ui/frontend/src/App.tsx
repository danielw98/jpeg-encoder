import { useState, useEffect } from 'react';
import { ImageUpload } from './components/ImageUpload';
import { EncodingOptions } from './components/EncodingOptions';
import { ResultsPanel } from './components/ResultsPanel';
import { SampleImages } from './components/SampleImages';
import { ComparisonView } from './components/ComparisonView';
import { DCTVisualization } from './components/DCTVisualization';
import { QualityChart } from './components/QualityChart';
import { PipelineView } from './components/PipelineView';
import { useEncoder, EncodeResult } from './hooks/useEncoder';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'error';
  components?: {
    cli: { available: boolean };
  };
}

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState<'color_420' | 'grayscale'>('color_420');
  const [result, setResult] = useState<EncodeResult | null>(null);
  const [activeTab, setActiveTab] = useState<'results' | 'comparison' | 'dct' | 'quality' | 'pipeline'>('comparison');
  const [inputCollapsed, setInputCollapsed] = useState(false);

  const { encode, encodeSample, loading, error } = useEncoder();

  // Check backend health on mount
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(() => setHealth({ status: 'error' }));
  }, []);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setResult(null);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // Handle encode button click
  const handleEncode = async () => {
    if (!selectedFile) return;

    const encodeResult = await encode(selectedFile, quality, format, true);
    if (encodeResult) {
      setResult(encodeResult);
      setInputCollapsed(true); // Collapse input panel after encoding
    }
  };

  // Handle sample image selection
  const handleSampleEncode = async (imageName: string) => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);

    const encodeResult = await encodeSample(imageName, quality, format, true);
    if (encodeResult) {
      setResult(encodeResult);
      setInputCollapsed(true); // Collapse input panel after encoding
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>JPEGDSP Encoder</h1>
        <p>Educational JPEG encoder with DSP visualization</p>
        {health && (
          <span className={`status-badge ${health.status}`}>
            {health.status === 'healthy' ? '✓ CLI Ready' : 
             health.status === 'degraded' ? '⚠ CLI Unavailable' : '✗ Backend Error'}
          </span>
        )}
      </header>

      <div className={`main-layout ${inputCollapsed && result ? 'collapsed' : ''}`}>
        {/* Left Panel: Input - Collapsible when we have results */}
        <div className={`input-panel ${inputCollapsed && result ? 'collapsed' : ''}`}>
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Input Image</h2>
                {!inputCollapsed && <p>Upload a PNG/PPM/PGM image or select a sample</p>}
              </div>
              {result && (
                <button 
                  className="collapse-btn"
                  onClick={() => setInputCollapsed(!inputCollapsed)}
                  title={inputCollapsed ? 'Expand panel' : 'Collapse panel'}
                >
                  {inputCollapsed ? '▶' : '◀'}
                </button>
              )}
            </div>

            {!inputCollapsed && (
              <>
                <SampleImages onSelect={handleSampleEncode} loading={loading} />

                <ImageUpload 
                  onFileSelect={handleFileSelect} 
                  previewUrl={previewUrl}
                  filename={selectedFile?.name}
                />

                <EncodingOptions
                  quality={quality}
                  onQualityChange={setQuality}
                  format={format}
                  onFormatChange={setFormat}
                />

                <button 
                  className="btn btn-primary" 
                  onClick={handleEncode}
                  disabled={!selectedFile || loading}
                  style={{ width: '100%', marginTop: '16px' }}
                >
                  {loading ? 'Encoding...' : 'Encode to JPEG'}
                </button>

                {error && (
                  <div className="error-message" style={{ marginTop: '16px' }}>
                    {error}
                  </div>
                )}
              </>
            )}

            {inputCollapsed && result && (
              <div className="collapsed-summary">
                <p><strong>Q{quality}</strong> | {result.originalWidth}×{result.originalHeight}</p>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setInputCollapsed(false)}
                >
                  New Image
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Results - Expands when input is collapsed */}
        <div className={`results-panel ${inputCollapsed && result ? 'expanded' : ''}`}>
          <div className="card">
            <div className="card-header">
              <h2>Results</h2>
              {result && (
                <div className="tab-selector">
                  <button 
                    className={`tab-btn ${activeTab === 'comparison' ? 'active' : ''}`}
                    onClick={() => setActiveTab('comparison')}
                  >
                    📷 Compare
                  </button>
                  <button 
                    className={`tab-btn ${activeTab === 'pipeline' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pipeline')}
                  >
                    ⚙️ Pipeline
                  </button>
                  <button 
                    className={`tab-btn ${activeTab === 'dct' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dct')}
                  >
                    🔄 DCT
                  </button>
                  <button 
                    className={`tab-btn ${activeTab === 'quality' ? 'active' : ''}`}
                    onClick={() => setActiveTab('quality')}
                  >
                    📈 Quality
                  </button>
                  <button 
                    className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
                    onClick={() => setActiveTab('results')}
                  >
                    📊 Stats
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Encoding image...</p>
              </div>
            ) : result ? (
              <>
                {activeTab === 'comparison' && (
                  <ComparisonView result={result} originalUrl={previewUrl} />
                )}
                {activeTab === 'pipeline' && (
                  <PipelineView result={result} />
                )}
                {activeTab === 'dct' && (
                  <DCTVisualization result={result} />
                )}
                {activeTab === 'quality' && (
                  <QualityChart result={result} onQualityChange={setQuality} />
                )}
                {activeTab === 'results' && (
                  <ResultsPanel result={result} />
                )}
              </>
            ) : (
              <div className="loading">
                <p style={{ fontSize: '3rem', marginBottom: '12px' }}>📊</p>
                <p>Encode an image to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
