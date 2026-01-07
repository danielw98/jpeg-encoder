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

// Kodak PhotoCD dataset - official descriptions from r0k.us/graphics/kodak/PhotoCD_credits.txt
const KODAK_SAMPLES = [
  { name: 'kodim01.png', label: '01 - Stone Building' },
  { name: 'kodim02.png', label: '02 - Red Door' },
  { name: 'kodim03.png', label: '03 - Hats' },
  { name: 'kodim04.png', label: '04 - Portrait Girl in Red' },
  { name: 'kodim05.png', label: '05 - Motocross Bikes' },
  { name: 'kodim06.png', label: '06 - Sailboat at Anchor' },
  { name: 'kodim07.png', label: '07 - Shuttered Windows' },
  { name: 'kodim08.png', label: '08 - Market Place' },
  { name: 'kodim09.png', label: '09 - Sailboats Spinnakers' },
  { name: 'kodim10.png', label: '10 - Offshore Sailboat Race' },
  { name: 'kodim11.png', label: '11 - Sailboat at Pier' },
  { name: 'kodim12.png', label: '12 - Couple on Beach' },
  { name: 'kodim13.png', label: '13 - Mountain Stream' },
  { name: 'kodim14.png', label: '14 - White Water Rafters' },
  { name: 'kodim15.png', label: '15 - Girl Painted Face' },
  { name: 'kodim16.png', label: '16 - Tropical Key' },
  { name: 'kodim17.png', label: '17 - Monument Cologne' },
  { name: 'kodim18.png', label: '18 - Model Black Dress' },
  { name: 'kodim19.png', label: '19 - Lighthouse Maine' },
  { name: 'kodim20.png', label: '20 - P51 Mustang' },
  { name: 'kodim21.png', label: '21 - Portland Head Light' },
  { name: 'kodim22.png', label: '22 - Barn and Pond' },
  { name: 'kodim23.png', label: '23 - Two Macaws' },
  { name: 'kodim24.png', label: '24 - Mountain Chalet' },
];

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
