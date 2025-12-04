import { useState, useEffect } from 'react'
import axios from 'axios'

// Views
import IntroView from './components/IntroView'
import FourierView from './components/FourierView'
import FiltersView from './components/FiltersView'
import ConvolutionView from './components/ConvolutionView'
import KernelsView from './components/KernelsView'
import KernelsEducationalView from './components/KernelsEducationalView'
import WaveletPlayground from './components/WaveletPlayground'
import WaveletBasisView from './components/WaveletBasisView'
import WaveletEducationView from './components/WaveletEducationView'
import MallatUnifiedView from './components/MallatUnifiedView'
import DenoiseView from './components/DenoiseView'
import CompareView from './components/CompareView'
import GuidedTour from './components/GuidedTour'

const API_BASE = '/api'

const SECTIONS = [
  { id: 'intro', label: '🎯 Introducere', icon: '🎯' },
  { id: 'fourier', label: '📊 Fourier', icon: '📊' },
  { id: 'filters', label: '🔧 Filtre', icon: '🔧' },
  { id: 'convolution', label: '🔄 Convoluție', icon: '🔄' },
  { id: 'kernels', label: '🔲 Kernels', icon: '🔲' },
  { id: 'kernels-edu', label: '🎓 Kernels Edu', icon: '🎓' },
  { id: 'playground', label: '🎮 Playground', icon: '🎮' },
  { id: 'wavelet-theory', label: '🎓 Teorie Wavelets', icon: '🎓' },
  { id: 'wavelet-basis', label: '🌊 Baze Wavelet', icon: '🌊' },
  { id: 'decompose', label: '🔬 Decompoziție', icon: '🔬' },
  { id: 'denoise', label: '🔇 Denoising', icon: '🔇' },
  { id: 'compare', label: '⚖️ DCT vs Wavelet', icon: '⚖️' }
]

export default function App() {
  const [activeSection, setActiveSection] = useState('intro')
  const [sampleImages, setSampleImages] = useState([])
  const [selectedImage, setSelectedImage] = useState('peppers_512')
  // Auto-start guided mode if URL has a hash (slide ID)
  const [guidedMode, setGuidedMode] = useState(() => window.location.hash.length > 1)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    // Load sample images on startup
    axios.get(`${API_BASE}/sample-images`)
      .then(res => setSampleImages(res.data.images))
      .catch(console.error)
  }, [])

  const handleNext = () => {
    const currentIndex = SECTIONS.findIndex(s => s.id === activeSection)
    if (currentIndex < SECTIONS.length - 1) {
      setActiveSection(SECTIONS[currentIndex + 1].id)
    }
  }

  const handlePrev = () => {
    const currentIndex = SECTIONS.findIndex(s => s.id === activeSection)
    if (currentIndex > 0) {
      setActiveSection(SECTIONS[currentIndex - 1].id)
    }
  }

  return (
    <div className={`app ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar Navigation */}
      <nav className="sidebar">
        <div className="sidebar-header">
          <h1>🌊 Wavelet</h1>
          <p>Transform</p>
        </div>
        
        <div className="nav-sections">
          {SECTIONS.map((section, idx) => (
            <button
              key={section.id}
              className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="nav-icon">{section.icon}</span>
              <span className="nav-label">{section.label.replace(/^[^\s]+\s/, '')}</span>
              <span className="nav-number">{idx + 1}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <button 
            className={`guided-toggle ${guidedMode ? 'active' : ''}`}
            onClick={() => setGuidedMode(!guidedMode)}
          >
            {guidedMode ? '📖 Exit Guide' : '📖 Start Guide'}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Navigation arrows with sidebar toggle */}
        <div className="nav-arrows">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Arată meniul' : 'Ascunde meniul'}
          >
            {sidebarCollapsed ? '☰' : '✕'}
          </button>
          
          <div className="nav-arrows-center">
            <button 
              className="nav-arrow prev" 
              onClick={handlePrev}
              disabled={SECTIONS.findIndex(s => s.id === activeSection) === 0}
            >
              ←
            </button>
            <span className="section-indicator">
              {SECTIONS.findIndex(s => s.id === activeSection) + 1} / {SECTIONS.length}
            </span>
            <button 
              className="nav-arrow next" 
              onClick={handleNext}
              disabled={SECTIONS.findIndex(s => s.id === activeSection) === SECTIONS.length - 1}
            >
              →
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="content-area">
          {activeSection === 'intro' && <IntroView onNext={handleNext} onStartGuide={() => setGuidedMode(true)} />}
          {activeSection === 'fourier' && <FourierView api={API_BASE} />}
          {activeSection === 'filters' && <FiltersView api={API_BASE} />}
          {activeSection === 'convolution' && <ConvolutionView />}
          {activeSection === 'kernels' && <KernelsView api={API_BASE} imageId={selectedImage} sampleImages={sampleImages} onImageChange={setSelectedImage} />}
          {activeSection === 'kernels-edu' && <KernelsEducationalView api={API_BASE} />}
          {activeSection === 'playground' && <WaveletPlayground />}
          {activeSection === 'wavelet-theory' && <WaveletEducationView api={API_BASE} />}
          {activeSection === 'wavelet-basis' && <WaveletBasisView api={API_BASE} />}
          {activeSection === 'decompose' && <MallatUnifiedView />}
          {activeSection === 'denoise' && <DenoiseView api={API_BASE} imageId={selectedImage} sampleImages={sampleImages} onImageChange={setSelectedImage} />}
          {activeSection === 'compare' && <CompareView api={API_BASE} imageId={selectedImage} sampleImages={sampleImages} onImageChange={setSelectedImage} />}
        </div>
      </main>

      {/* Guided Tour Overlay */}
      {guidedMode && (
        <GuidedTour 
          onClose={() => setGuidedMode(false)}
          onNavigate={(section) => {
            setActiveSection(section)
            setGuidedMode(false)
          }}
          selectedImage={selectedImage}
          sampleImages={sampleImages}
        />
      )}
    </div>
  )
}
