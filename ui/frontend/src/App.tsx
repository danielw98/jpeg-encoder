import { useState, useEffect } from 'react';
import { ImageUpload } from './components/ImageUpload';
import { EncodingOptions } from './components/EncodingOptions';
import { ResultsPanel } from './components/ResultsPanel';
import { SampleImages } from './components/SampleImages';
import { ComparisonView } from './components/ComparisonView';
import { DCTVisualization } from './components/DCTVisualization';
import { QualityChart } from './components/QualityChart';
import { PipelineView } from './components/PipelineView';
import { ThemeToggle } from './components/ThemeToggle';
import { useEncoder, EncodeResult } from './hooks/useEncoder';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faCog, faSync, faChartLine, faChartBar } from '@fortawesome/free-solid-svg-icons';

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
  const [activeTab, setActiveTab] = useState<'comparison' | 'pipeline' | 'dct' | 'quality' | 'stats'>('comparison');

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
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // Handle encode button click
  const handleEncode = async () => {
    if (!selectedFile) return;
    const encodeResult = await encode(selectedFile, quality, format, true);
    if (encodeResult) {
      setResult(encodeResult);
    }
  };

  // Handle sample image selection
  const handleSampleEncode = async (imageName: string) => {
    setSelectedFile(null);
    setResult(null);
    // Set original URL to the raw image endpoint
    setPreviewUrl(`/api/images/${imageName}/raw`);
    const encodeResult = await encodeSample(imageName, quality, format, true);
    if (encodeResult) {
      setResult(encodeResult);
    }
  };

  // Go back to upload page
  const handleReset = () => {
    setResult(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setActiveTab('comparison');
  };

  // Page 1: Upload/Input
  if (!result && !loading) {
    return (
      <div className="app upload-page">
        <header className="app-header">
          <ThemeToggle />
          <h1>JPEG Encoder</h1>
          <p>Upload an image to compress and analyze</p>
          {health && (
            <span className={`status-badge ${health.status}`}>
              {health.status === 'healthy' ? '✓ Ready' : 
               health.status === 'degraded' ? '⚠ Limited' : '✗ Error'}
            </span>
          )}
        </header>

        <div className="upload-container">
          <div className="card upload-card">
            <SampleImages onSelect={handleSampleEncode} loading={loading} />
            
            <div className="divider">
              <span>or upload your own</span>
            </div>

            <ImageUpload 
              onFileSelect={handleFileSelect} 
              previewUrl={previewUrl}
              filename={selectedFile?.name}
            />

            {selectedFile && (
              <>
                <EncodingOptions
                  quality={quality}
                  onQualityChange={setQuality}
                  format={format}
                  onFormatChange={setFormat}
                />

                <button 
                  className="btn btn-primary btn-encode" 
                  onClick={handleEncode}
                  disabled={loading}
                >
                  Encode to JPEG →
                </button>
              </>
            )}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="app loading-page">
        <div className="loading-container">
          <div className="spinner large"></div>
          <p>Encoding image...</p>
        </div>
      </div>
    );
  }

  // Page 2: Results
  return (
    <div className="app results-page">
      <header className="app-header results-header">
        <ThemeToggle />
      </header>
      <div className="tab-bar">
        <button className="btn btn-back" onClick={handleReset}>
          ← Back
        </button>
        <div className="tab-buttons">
        <button 
          className={`tab-btn ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          <FontAwesomeIcon icon={faCamera} /> Compare
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pipeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipeline')}
        >
          <FontAwesomeIcon icon={faCog} /> Pipeline
        </button>
        <button 
          className={`tab-btn ${activeTab === 'dct' ? 'active' : ''}`}
          onClick={() => setActiveTab('dct')}
        >
          <FontAwesomeIcon icon={faSync} /> DCT
        </button>
        <button 
          className={`tab-btn ${activeTab === 'quality' ? 'active' : ''}`}
          onClick={() => setActiveTab('quality')}
        >
          <FontAwesomeIcon icon={faChartLine} /> Quality
        </button>
        <button 
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <FontAwesomeIcon icon={faChartBar} /> Stats
        </button>
        </div>
      </div>

      <div className="results-content">
        {activeTab === 'comparison' && (
          <ComparisonView result={result!} originalUrl={previewUrl} />
        )}
        {activeTab === 'pipeline' && (
          <PipelineView result={result!} />
        )}
        {activeTab === 'dct' && (
          <DCTVisualization result={result!} />
        )}
        {activeTab === 'quality' && (
          <QualityChart result={result!} onQualityChange={setQuality} />
        )}
        {activeTab === 'stats' && (
          <ResultsPanel result={result!} />
        )}
      </div>
    </div>
  );
}

export default App;
