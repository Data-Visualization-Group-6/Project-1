import { useMemo } from 'react';

export default function RegionFilter({ regions, selected, onChange }) {
  const ALL = 'World';
  const opts = useMemo(
    () => [ALL, ...regions.filter(r => r !== ALL)],
    [regions]
  );

  const toggle = (r) => {
    if (r === ALL) return onChange(new Set([ALL]));
    const next = new Set(selected);
    next.delete(ALL);
    next.has(r) ? next.delete(r) : next.add(r);
    if (next.size === 0) next.add(ALL);
    onChange(next);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {opts.map(r => (
        <label key={r} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={selected.has('World') ? r === 'World' : selected.has(r)}
            onChange={() => toggle(r)}
          />
          <span>{r}</span>
        </label>
      ))}
    </div>
  );
}
