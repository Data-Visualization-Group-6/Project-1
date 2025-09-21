import { useEffect, useMemo, useState } from 'react';
import { loadHappinessYear, AXIS_LABELS } from './data/LoadHappiness';
import RegionFilter from './components/RegionFilter';
import YearSlider from './components/YearSlider';
import ParallelCoordinates from './components/ParallelCoordinates';

export default function App() {
  const [year, setYear] = useState(2019);
  const [data, setData] = useState([]);
  const [regions, setRegions] = useState([]);
  const [selected, setSelected] = useState(new Set(['World']));
  const [norm, setNorm] = useState('ten'); // default to 0–10

  // Load whenever the year changes
  useEffect(() => {
    (async () => {
      const { data, regions } = await loadHappinessYear(year);
      setData(data);
      setRegions(regions);
      // keep current selection if still valid; else fallback to World
      if (![...selected].every(r => r === 'World' || regions.includes(r))) {
        setSelected(new Set(['World']));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  // Parallel coordinates axis order / labels (constant across years)
  const dims = useMemo(() => ([
    { key: 'score',      label: AXIS_LABELS.score },
    { key: 'generosity', label: AXIS_LABELS.generosity },
    { key: 'gdp',        label: AXIS_LABELS.gdp },
    { key: 'social',     label: AXIS_LABELS.social },
    { key: 'life',       label: AXIS_LABELS.life },
    { key: 'freedom',    label: AXIS_LABELS.freedom },
    { key: 'corruption', label: AXIS_LABELS.corruption },
  ]), []);

  // Filter data by selected regions
  const filtered = useMemo(() => {
    if (selected.has('World')) return data;
    const allow = new Set(selected);
    return data.filter(d => allow.has(d.region));
  }, [data, selected]);

  return (
    <div style={{ display: 'grid', gap: 16, padding: 16, color: '#e6edf3' }}>
      <YearSlider year={year} onChange={setYear} />

      <div style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
        <span style={{opacity:.85}}>Scale:</span>
        <label><input type="radio" name="norm" value="raw" checked={norm==='raw'} onChange={()=>setNorm('raw')} /> Raw</label>
        <label><input type="radio" name="norm" value="ten" checked={norm==='ten'} onChange={()=>setNorm('ten')} /> 0–10</label>
      </div>

      <RegionFilter regions={['World', ...regions]} selected={selected} onChange={setSelected} />
      <ParallelCoordinates data={filtered} dims={dims} norm={norm} />
    </div>
  );
}
