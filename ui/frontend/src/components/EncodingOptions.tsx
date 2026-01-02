/**
 * EncodingOptions Component
 * 
 * Quality slider and format selection
 */

interface EncodingOptionsProps {
  quality: number;
  onQualityChange: (quality: number) => void;
  format: 'color_420' | 'grayscale';
  onFormatChange: (format: 'color_420' | 'grayscale') => void;
}

export function EncodingOptions({
  quality,
  onQualityChange,
  format,
  onFormatChange,
}: EncodingOptionsProps) {
  return (
    <div style={{ marginTop: '24px' }}>
      <div className="form-group">
        <label>
          Quality: <strong>{quality}</strong>
        </label>
        <input
          type="range"
          min={1}
          max={100}
          value={quality}
          onChange={(e) => onQualityChange(parseInt(e.target.value, 10))}
        />
        <div className="range-value">
          <span>1 (smallest)</span>
          <span>100 (best quality)</span>
        </div>
      </div>

      <div className="form-group">
        <label>Format</label>
        <select
          value={format}
          onChange={(e) => onFormatChange(e.target.value as 'color_420' | 'grayscale')}
        >
          <option value="color_420">Color (YCbCr 4:2:0)</option>
          <option value="grayscale">Grayscale</option>
        </select>
      </div>
    </div>
  );
}
