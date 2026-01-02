/**
 * SampleImages Component
 * 
 * Quick buttons to encode sample images
 */

interface SampleImagesProps {
  onSelect: (imageName: string) => void;
  loading: boolean;
}

const SAMPLES = [
  { name: 'baboon_512.png', label: 'Baboon' },
  { name: 'peppers_512.png', label: 'Peppers' },
  { name: 'lake_512.png', label: 'Lake' },
  { name: 'house_512.png', label: 'House' },
];

export function SampleImages({ onSelect, loading }: SampleImagesProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '8px' }}>
        Quick samples:
      </p>
      <div className="sample-images">
        {SAMPLES.map((sample) => (
          <button
            key={sample.name}
            className="sample-btn"
            onClick={() => onSelect(sample.name)}
            disabled={loading}
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
}
