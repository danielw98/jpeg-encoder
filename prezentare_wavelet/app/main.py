"""
Wavelet vs DCT - Interactive Browser Presentation

Full-featured Streamlit app with:
- Interactive wavelet decomposition
- Real-time denoising demo
- Animated visualizations
- Presentation mode with slides

Run with: streamlit run app/main.py
"""
import streamlit as st
import numpy as np
import pywt
from PIL import Image
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
import io
from pathlib import Path
import sys

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

st.set_page_config(
    page_title="Wavelet vs DCT - Interactive Presentation",
    page_icon="🌊",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS for presentation mode
st.markdown("""
<style>
    /* Hide Streamlit branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    
    /* Presentation styling */
    .main-title {
        font-size: 3rem;
        font-weight: bold;
        text-align: center;
        background: linear-gradient(90deg, #1E88E5, #7B1FA2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.5rem;
    }
    .subtitle {
        font-size: 1.5rem;
        color: #666;
        text-align: center;
        margin-bottom: 2rem;
    }
    .slide-title {
        font-size: 2rem;
        font-weight: bold;
        color: #1E88E5;
        border-bottom: 3px solid #1E88E5;
        padding-bottom: 0.5rem;
        margin-bottom: 1rem;
    }
    .info-box {
        background: linear-gradient(135deg, #E3F2FD, #BBDEFB);
        padding: 1.5rem;
        border-radius: 10px;
        border-left: 5px solid #1E88E5;
    }
    .warning-box {
        background: linear-gradient(135deg, #FFF3E0, #FFE0B2);
        padding: 1.5rem;
        border-radius: 10px;
        border-left: 5px solid #FF9800;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 1rem;
        background: #f0f2f6;
        padding: 0.5rem;
        border-radius: 10px;
    }
    .stTabs [data-baseweb="tab"] {
        font-size: 1.1rem;
        font-weight: 500;
    }
</style>
""", unsafe_allow_html=True)


def create_sample_image(size=256, pattern='checkerboard'):
    """Create sample images for demos"""
    if pattern == 'checkerboard':
        img = np.zeros((size, size))
        block = size // 8
        for i in range(8):
            for j in range(8):
                if (i + j) % 2 == 0:
                    img[i*block:(i+1)*block, j*block:(j+1)*block] = 255
        return img
    elif pattern == 'gradient':
        x = np.linspace(0, 255, size)
        return np.tile(x, (size, 1))
    elif pattern == 'circles':
        y, x = np.ogrid[:size, :size]
        center = size // 2
        r = np.sqrt((x - center)**2 + (y - center)**2)
        return (128 + 127 * np.sin(r / 10)).astype(np.uint8)
    elif pattern == 'edges':
        img = np.zeros((size, size))
        img[:, size//4:3*size//4] = 255
        img[size//4:3*size//4, :] = 255 - img[size//4:3*size//4, :]
        return img
    return np.random.rand(size, size) * 255


def plot_time_frequency_comparison():
    """Create time-frequency plane comparison figure"""
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))
    
    # STFT - uniform grid
    ax = axes[0]
    ax.set_title('STFT (Fixed Window)', fontsize=14, fontweight='bold', color='#1E88E5')
    ax.set_xlabel('Time')
    ax.set_ylabel('Frequency')
    
    # Draw uniform boxes
    for i in range(5):
        for j in range(5):
            rect = Rectangle((i*0.2, j*0.2), 0.18, 0.18, 
                            linewidth=2, edgecolor='#1E88E5', 
                            facecolor='#BBDEFB', alpha=0.7)
            ax.add_patch(rect)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.set_aspect('equal')
    
    # Wavelet - adaptive grid
    ax = axes[1]
    ax.set_title('Wavelet (Adaptive Windows)', fontsize=14, fontweight='bold', color='#4CAF50')
    ax.set_xlabel('Time')
    ax.set_ylabel('Frequency')
    
    # Low frequency - wide in time
    for i in range(2):
        rect = Rectangle((i*0.5, 0), 0.48, 0.15, 
                        linewidth=2, edgecolor='#4CAF50', 
                        facecolor='#C8E6C9', alpha=0.7)
        ax.add_patch(rect)
    
    # Mid frequency
    for i in range(4):
        rect = Rectangle((i*0.25, 0.2), 0.23, 0.25, 
                        linewidth=2, edgecolor='#4CAF50', 
                        facecolor='#C8E6C9', alpha=0.7)
        ax.add_patch(rect)
    
    # High frequency - narrow in time
    for i in range(8):
        rect = Rectangle((i*0.125, 0.5), 0.12, 0.45, 
                        linewidth=2, edgecolor='#4CAF50', 
                        facecolor='#C8E6C9', alpha=0.7)
        ax.add_patch(rect)
    
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.set_aspect('equal')
    
    plt.tight_layout()
    return fig


def plot_wavelet_family(wavelet_name='db4'):
    """Plot wavelet and scaling functions"""
    try:
        wavelet = pywt.Wavelet(wavelet_name)
        phi, psi, x = wavelet.wavefun(level=8)
        
        fig, axes = plt.subplots(1, 2, figsize=(12, 4))
        
        axes[0].plot(x, phi, 'b-', linewidth=2)
        axes[0].fill_between(x, phi, alpha=0.3)
        axes[0].set_title(f'Scaling Function φ(t) - {wavelet_name}', fontsize=12)
        axes[0].set_xlabel('t')
        axes[0].grid(True, alpha=0.3)
        
        axes[1].plot(x, psi, 'r-', linewidth=2)
        axes[1].fill_between(x, psi, alpha=0.3, color='red')
        axes[1].set_title(f'Wavelet Function ψ(t) - {wavelet_name}', fontsize=12)
        axes[1].set_xlabel('t')
        axes[1].grid(True, alpha=0.3)
        
        plt.tight_layout()
        return fig
    except:
        return None


def perform_dwt2d(image, wavelet='db4', level=1):
    """Perform 2D DWT and return coefficients"""
    coeffs = pywt.wavedec2(image, wavelet, level=level)
    return coeffs


def create_subband_visualization(coeffs):
    """Create visualization of wavelet subbands"""
    # Get the approximation and detail coefficients
    arr, coeff_slices = pywt.coeffs_to_array(coeffs)
    
    # Normalize for display
    arr_norm = arr.copy()
    arr_norm = (arr_norm - arr_norm.min()) / (arr_norm.max() - arr_norm.min() + 1e-10)
    
    return arr_norm, coeff_slices


def wavelet_denoise(image, wavelet='db4', level=4, threshold=None, mode='soft'):
    """Denoise image using wavelet thresholding"""
    coeffs = pywt.wavedec2(image, wavelet, level=level)
    
    # Estimate noise from HH subband at finest level
    sigma = np.median(np.abs(coeffs[-1][2])) / 0.6745
    
    if threshold is None:
        # Universal threshold
        threshold = sigma * np.sqrt(2 * np.log(image.size))
    
    # Threshold detail coefficients
    new_coeffs = [coeffs[0]]  # Keep approximation
    for detail_level in coeffs[1:]:
        new_detail = tuple(
            pywt.threshold(c, threshold, mode=mode) 
            for c in detail_level
        )
        new_coeffs.append(new_detail)
    
    # Reconstruct
    denoised = pywt.waverec2(new_coeffs, wavelet)
    return np.clip(denoised[:image.shape[0], :image.shape[1]], 0, 255), sigma, threshold


def add_noise(image, sigma=25):
    """Add Gaussian noise to image"""
    noisy = image + np.random.normal(0, sigma, image.shape)
    return np.clip(noisy, 0, 255)


# ============================================================================
# MAIN APPLICATION
# ============================================================================

# Sidebar for navigation
with st.sidebar:
    st.markdown("## 🎯 Navigation")
    page = st.radio(
        "Go to:",
        ["🏠 Home", "📊 Time-Frequency", "🔲 Mallat DWT", "🔇 Denoising", "🖼️ Compression"],
        label_visibility="collapsed"
    )
    
    st.markdown("---")
    st.markdown("### ⚙️ Settings")
    dark_mode = st.checkbox("Dark plots", value=False)
    
    if dark_mode:
        plt.style.use('dark_background')
    else:
        plt.style.use('default')

# ============================================================================
# HOME PAGE
# ============================================================================
if page == "🏠 Home":
    st.markdown('<div class="main-title">🌊 Waveleți vs DCT</div>', unsafe_allow_html=True)
    st.markdown('<div class="subtitle">Interactive Digital Signal Processing Demo</div>', unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("""
        ### 📊 Time-Frequency
        Compare STFT fixed windows with adaptive wavelet resolution.
        See Heisenberg uncertainty in action.
        """)
        
    with col2:
        st.markdown("""
        ### 🔲 Mallat DWT
        Interactive 2D wavelet decomposition.
        Explore LL, LH, HL, HH subbands.
        """)
        
    with col3:
        st.markdown("""
        ### 🔇 Denoising
        Real-time wavelet denoising.
        Adjust threshold and see SNR improve.
        """)
    
    st.markdown("---")
    
    # Quick demo
    st.markdown("### 🚀 Quick Demo: Wavelet Decomposition")
    
    demo_image = create_sample_image(256, 'circles')
    coeffs = perform_dwt2d(demo_image, 'haar', level=2)
    arr_norm, _ = create_subband_visualization(coeffs)
    
    col1, col2 = st.columns(2)
    with col1:
        st.image(demo_image / 255, caption="Original Image", use_container_width=True)
    with col2:
        st.image(arr_norm, caption="Wavelet Decomposition (2 levels)", use_container_width=True)

# ============================================================================
# TIME-FREQUENCY PAGE
# ============================================================================
elif page == "📊 Time-Frequency":
    st.markdown('<div class="slide-title">📊 Fourier vs Wavelet: Time-Frequency Resolution</div>', unsafe_allow_html=True)
    
    # Comparison figure
    fig = plot_time_frequency_comparison()
    st.pyplot(fig)
    plt.close()
    
    st.markdown("---")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        <div class="info-box">
        <h4>🔷 STFT (Short-Time Fourier Transform)</h4>
        <ul>
            <li><strong>Fixed window size</strong> for all frequencies</li>
            <li>Same time-frequency resolution everywhere</li>
            <li>Good for <em>stationary</em> signals</li>
        </ul>
        <p><strong>Limitation:</strong> Trade-off is fixed - can't adapt to signal characteristics</p>
        </div>
        """, unsafe_allow_html=True)
        
    with col2:
        st.markdown("""
        <div class="info-box" style="border-left-color: #4CAF50; background: linear-gradient(135deg, #E8F5E9, #C8E6C9);">
        <h4>🟢 Wavelet Transform</h4>
        <ul>
            <li><strong>Adaptive windows</strong> that scale with frequency</li>
            <li>High freq → narrow window (good time resolution)</li>
            <li>Low freq → wide window (good frequency resolution)</li>
        </ul>
        <p><strong>Advantage:</strong> Multi-resolution analysis</p>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    st.markdown("### 📐 Heisenberg Uncertainty Principle")
    
    st.latex(r"\Delta t \cdot \Delta f \geq \frac{1}{4\pi}")
    
    st.markdown("""
    The **area** on the time-frequency plane is constant (Heisenberg box).
    - **STFT**: Uniform boxes → same uncertainty everywhere
    - **Wavelets**: Redistribute uncertainty → adapt to the signal
    """)
    
    # Interactive wavelet visualization
    st.markdown("---")
    st.markdown("### 🔬 Explore Wavelet Functions")
    
    wavelet_choice = st.selectbox(
        "Select Wavelet:",
        ['haar', 'db4', 'db8', 'sym4', 'coif2', 'bior2.2', 'bior4.4'],
        index=1
    )
    
    fig = plot_wavelet_family(wavelet_choice)
    if fig:
        st.pyplot(fig)
        plt.close()

# ============================================================================
# MALLAT DWT PAGE
# ============================================================================
elif page == "🔲 Mallat DWT":
    st.markdown('<div class="slide-title">🔲 Mallat 2D Wavelet Decomposition</div>', unsafe_allow_html=True)
    
    col1, col2 = st.columns([1, 2])
    
    with col1:
        st.markdown("### Settings")
        
        image_source = st.radio("Image source:", ["Sample", "Upload"])
        
        if image_source == "Sample":
            pattern = st.selectbox("Pattern:", ['circles', 'checkerboard', 'gradient', 'edges'])
            size = st.slider("Size:", 128, 512, 256, 64)
            image = create_sample_image(size, pattern)
        else:
            uploaded = st.file_uploader("Upload image:", type=['png', 'jpg', 'jpeg'])
            if uploaded:
                img = Image.open(uploaded).convert('L')
                image = np.array(img, dtype=np.float64)
            else:
                image = create_sample_image(256, 'circles')
        
        wavelet = st.selectbox("Wavelet:", ['haar', 'db4', 'db8', 'bior2.2', 'bior4.4'], index=0)
        levels = st.slider("Decomposition levels:", 1, 5, 2)
    
    with col2:
        # Perform DWT
        coeffs = perform_dwt2d(image, wavelet, levels)
        arr_norm, coeff_slices = create_subband_visualization(coeffs)
        
        fig, axes = plt.subplots(1, 3, figsize=(15, 5))
        
        axes[0].imshow(image, cmap='gray')
        axes[0].set_title('Original', fontsize=12)
        axes[0].axis('off')
        
        axes[1].imshow(arr_norm, cmap='gray')
        axes[1].set_title(f'DWT ({wavelet}, {levels} levels)', fontsize=12)
        axes[1].axis('off')
        
        # Show LL approximation
        axes[2].imshow(coeffs[0], cmap='gray')
        axes[2].set_title('LL (Approximation)', fontsize=12)
        axes[2].axis('off')
        
        plt.tight_layout()
        st.pyplot(fig)
        plt.close()
    
    st.markdown("---")
    
    # Subband explanation
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown("""
        **LL (Low-Low)**
        - Approximation
        - Downscaled version
        - Contains most energy
        """)
    with col2:
        st.markdown("""
        **LH (Low-High)**
        - Horizontal details
        - Horizontal edges
        - Rows: low, Cols: high
        """)
    with col3:
        st.markdown("""
        **HL (High-Low)**
        - Vertical details
        - Vertical edges
        - Rows: high, Cols: low
        """)
    with col4:
        st.markdown("""
        **HH (High-High)**
        - Diagonal details
        - Diagonal edges
        - Both: high-pass
        """)

# ============================================================================
# DENOISING PAGE
# ============================================================================
elif page == "🔇 Denoising":
    st.markdown('<div class="slide-title">🔇 Wavelet Denoising</div>', unsafe_allow_html=True)
    
    col1, col2 = st.columns([1, 2])
    
    with col1:
        st.markdown("### Parameters")
        
        # Create or upload image
        use_upload = st.checkbox("Upload custom image")
        
        if use_upload:
            uploaded = st.file_uploader("Upload:", type=['png', 'jpg', 'jpeg'])
            if uploaded:
                original = np.array(Image.open(uploaded).convert('L'), dtype=np.float64)
            else:
                original = create_sample_image(256, 'circles')
        else:
            original = create_sample_image(256, 'circles')
        
        noise_sigma = st.slider("Noise level (σ):", 5, 100, 30)
        wavelet = st.selectbox("Wavelet:", ['db4', 'db8', 'sym4', 'bior4.4'], key='denoise_wavelet')
        levels = st.slider("DWT levels:", 2, 6, 4, key='denoise_levels')
        threshold_mode = st.radio("Threshold mode:", ['soft', 'hard'], horizontal=True)
        
        auto_threshold = st.checkbox("Auto threshold (Universal)", value=True)
        if not auto_threshold:
            manual_threshold = st.slider("Manual threshold:", 1.0, 200.0, 50.0)
        else:
            manual_threshold = None
    
    with col2:
        # Add noise
        noisy = add_noise(original, noise_sigma)
        
        # Denoise
        denoised, estimated_sigma, used_threshold = wavelet_denoise(
            noisy, wavelet, levels, manual_threshold, threshold_mode
        )
        
        # Calculate metrics
        mse_noisy = np.mean((original - noisy)**2)
        mse_denoised = np.mean((original - denoised)**2)
        psnr_noisy = 10 * np.log10(255**2 / mse_noisy) if mse_noisy > 0 else float('inf')
        psnr_denoised = 10 * np.log10(255**2 / mse_denoised) if mse_denoised > 0 else float('inf')
        
        # Display
        fig, axes = plt.subplots(1, 3, figsize=(15, 5))
        
        axes[0].imshow(original, cmap='gray', vmin=0, vmax=255)
        axes[0].set_title('Original', fontsize=12)
        axes[0].axis('off')
        
        axes[1].imshow(noisy, cmap='gray', vmin=0, vmax=255)
        axes[1].set_title(f'Noisy (PSNR: {psnr_noisy:.1f} dB)', fontsize=12)
        axes[1].axis('off')
        
        axes[2].imshow(denoised, cmap='gray', vmin=0, vmax=255)
        axes[2].set_title(f'Denoised (PSNR: {psnr_denoised:.1f} dB)', fontsize=12)
        axes[2].axis('off')
        
        plt.tight_layout()
        st.pyplot(fig)
        plt.close()
        
        # Metrics
        improvement = psnr_denoised - psnr_noisy
        st.success(f"✅ PSNR improvement: **+{improvement:.1f} dB** | Threshold: {used_threshold:.1f} | Est. σ: {estimated_sigma:.1f}")

    st.markdown("---")
    
    # Theory
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        ### How It Works
        
        1. **DWT**: Transform to wavelet domain
        2. **Threshold**: Remove small coefficients (noise)
        3. **IDWT**: Transform back
        
        **Key insight**: Signal → few large coefficients, Noise → many small coefficients
        """)
    
    with col2:
        st.markdown("""
        ### Threshold Modes
        
        **Soft**: $T_S(x) = \\text{sign}(x) \\cdot \\max(|x| - \\lambda, 0)$
        - Shrinks all coefficients
        - Smoother results
        
        **Hard**: $T_H(x) = x \\cdot \\mathbf{1}_{|x| \\geq \\lambda}$
        - Keep or zero
        - Preserves edges better
        """)

# ============================================================================
# COMPRESSION PAGE  
# ============================================================================
elif page == "🖼️ Compression":
    st.markdown('<div class="slide-title">🖼️ JPEG (DCT) vs Wavelet Compression</div>', unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        ### JPEG (DCT)
        
        - **8×8 block DCT**
        - Fixed block boundaries
        - Quantization per block
        
        **Artifacts at high compression:**
        - ❌ Block edges visible ("blocking")
        - ❌ Ringing near sharp edges
        - ✅ Fast, widely supported
        """)
        
    with col2:
        st.markdown("""
        ### JPEG2000 (Wavelet)
        
        - **Full-image or large tile DWT**
        - No fixed block boundaries
        - Multi-resolution quantization
        
        **Artifacts at high compression:**
        - ✅ Smooth blur (no blocking)
        - ✅ Progressive transmission
        - ❌ More complex, slower
        """)
    
    st.markdown("---")
    
    # Interactive compression demo
    st.markdown("### 🎚️ Compression Demo")
    
    original = create_sample_image(256, 'edges')
    
    compression = st.slider("Compression level (% coefficients kept):", 1, 100, 50)
    
    # Wavelet compression simulation
    coeffs = pywt.wavedec2(original, 'bior4.4', level=4)
    arr, slices = pywt.coeffs_to_array(coeffs)
    
    # Keep only top % coefficients
    threshold = np.percentile(np.abs(arr), 100 - compression)
    arr_compressed = np.where(np.abs(arr) >= threshold, arr, 0)
    
    coeffs_compressed = pywt.array_to_coeffs(arr_compressed, slices, output_format='wavedec2')
    reconstructed = pywt.waverec2(coeffs_compressed, 'bior4.4')
    reconstructed = np.clip(reconstructed[:256, :256], 0, 255)
    
    # Calculate metrics
    mse = np.mean((original - reconstructed)**2)
    psnr = 10 * np.log10(255**2 / mse) if mse > 0 else float('inf')
    nonzero = np.count_nonzero(arr_compressed)
    total = arr.size
    
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    
    axes[0].imshow(original, cmap='gray')
    axes[0].set_title('Original', fontsize=12)
    axes[0].axis('off')
    
    axes[1].imshow(np.abs(arr_compressed), cmap='hot')
    axes[1].set_title(f'Coefficients ({nonzero}/{total} = {100*nonzero/total:.1f}%)', fontsize=12)
    axes[1].axis('off')
    
    axes[2].imshow(reconstructed, cmap='gray')
    axes[2].set_title(f'Reconstructed (PSNR: {psnr:.1f} dB)', fontsize=12)
    axes[2].axis('off')
    
    plt.tight_layout()
    st.pyplot(fig)
    plt.close()
    
    st.info(f"💾 Keeping {compression}% of coefficients → PSNR: {psnr:.1f} dB")

# Footer
st.markdown("---")
st.markdown(
    "<div style='text-align: center; color: #888;'>"
    "Wavelet vs DCT - Interactive Presentation | Built with Streamlit & PyWavelets"
    "</div>", 
    unsafe_allow_html=True
)
