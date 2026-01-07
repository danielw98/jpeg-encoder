/**
 * SampleImages Component
 * 
 * Dropdown to select sample images including Kodak set
 */

interface SampleImagesProps {
  onSelect: (imageName: string) => void;
  loading: boolean;
}

const CLASSIC_SAMPLES = [
  { name: 'baboon_512.png', label: 'Baboon (512×512)' },
  { name: 'peppers_512.png', label: 'Peppers (512×512)' },
  { name: 'lake_512.png', label: 'Lake (512×512)' },
  { name: 'house_512.png', label: 'House (512×512)' },
];

const KODAK_SAMPLES = Array.from({ length: 24 }, (_, i) => ({
  name: `kodim${String(i + 1).padStart(2, '0')}.png`,
  label: `Kodak ${String(i + 1).padStart(2, '0')}`,
}));

export function SampleImages({ onSelect, loading }: SampleImagesProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value) {
      onSelect(value);
      e.target.value = ''; // Reset dropdown
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '8px', display: 'block' }}>
        Sample images:
      </label>
      <select 
        className="sample-select"
        onChange={handleChange}
        disabled={loading}
        defaultValue=""
      >
        <option value="" disabled>Select an image...</option>
        <optgroup label="Classic Test Images">
          {CLASSIC_SAMPLES.map((sample) => (
            <option key={sample.name} value={sample.name}>
              {sample.label}
            </option>
          ))}
        </optgroup>
        <optgroup label="Kodak PhotoCD (768×512)">
          {KODAK_SAMPLES.map((sample) => (
            <option key={sample.name} value={sample.name}>
              {sample.label}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}
