import { useCallback } from 'react';

export default function YearSlider({ year, onChange, min = 2015, max = 2019 }) {
  const handle = useCallback(e => {
    onChange(parseInt(e.target.value, 10));
  }, [onChange]);

  return (
    <div style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={year}
        onChange={handle}
      />
      <div style={{ textAlign: 'center', fontWeight: 600 }}>
        Year: {year}
      </div>
    </div>
  );
}
