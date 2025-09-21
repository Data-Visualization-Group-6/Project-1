import * as d3 from 'd3';

// Canonical axis labels (single source of truth for titles)
export const AXIS_LABELS = {
  score: 'Happiness score',
  gdp: 'GDP per capita',
  social: 'Social support',
  life: 'Healthy life expectancy',
  freedom: 'Freedom of choice',
  generosity: 'Generosity',
  corruption: 'Perceived corruption',
};

// Column name variants seen across 2015–2019 CSVs
const COLS = {
  country: ['Country or region', 'Country name', 'Country'],
  region: ['Region'],
  score: ['Score', 'Happiness Score', 'Ladder score', 'Happiness.Score'],
  gdp: [
    'GDP per capita',
    'Economy (GDP per Capita)',
    'Log GDP per capita',
    'Economy..GDP.per.Capita.',
  ],
  social: ['Social support', 'Family'],
  life: [
    'Healthy life expectancy',
    'Health (Life Expectancy)',
    'Health..Life.Expectancy.',
  ],
  freedom: ['Freedom to make life choices', 'Freedom'],
  generosity: ['Generosity'],
  corruption: [
    'Perceptions of corruption',
    'Trust (Government Corruption)',
    'Corruption',
    'Trust..Government.Corruption.',
  ],
};

// Flexible header matcher: tries exact, then normalized (lowercase, strip non-letters)
const norm = s => s.toLowerCase().replace(/[^a-z]/g, '');
function pickFlex(row, candidates) {
  // exact first
  for (const c of candidates) {
    if (row[c] != null && row[c] !== '') return row[c];
  }
  // normalized fallback
  const map = new Map(Object.keys(row).map(k => [norm(k), k]));
  for (const c of candidates) {
    const k = map.get(norm(c));
    if (k && row[k] !== '') return row[k];
  }
  return '';
}
function pickNumFlex(row, candidates) {
  const v = pickFlex(row, candidates);
  return v === '' ? NaN : +v;
}

// Cache region map from 2015 so we don’t refetch repeatedly
let REGION_MAP_2015 = null;
async function getRegionMap2015() {
  if (REGION_MAP_2015) return REGION_MAP_2015;
  const rows = await d3.csv('/data/2015.csv', d => ({
    country: (pickFlex(d, ['Country name', 'Country']) || '').trim(),
    region: (pickFlex(d, COLS.region) || '').trim() || 'World',
  }));
  REGION_MAP_2015 = new Map(rows.map(r => [r.country, r.region]));
  return REGION_MAP_2015;
}

// Load a specific year (2015–2019)
export async function loadHappinessYear(year) {
  const regionByCountry = await getRegionMap2015();

  const rows = await d3.csv(`/data/${year}.csv`, d => {
    const country = (pickFlex(d, COLS.country) || '').trim();
    const regionInFile = (pickFlex(d, COLS.region) || '').trim();
    return {
      country,
      region: regionInFile || regionByCountry.get(country) || 'World',
      score: pickNumFlex(d, COLS.score),
      gdp: pickNumFlex(d, COLS.gdp),
      social: pickNumFlex(d, COLS.social),
      life: pickNumFlex(d, COLS.life),
      freedom: pickNumFlex(d, COLS.freedom),
      generosity: pickNumFlex(d, COLS.generosity),
      corruption: pickNumFlex(d, COLS.corruption),
    };
  });

  const regions = Array.from(new Set(rows.map(r => r.region))).sort((a, b) => a.localeCompare(b));
  return { data: rows, regions };
}
