import { fetchYearData } from "./FetchData";

/**
 * Build year-over-year differences in the same shape as heatmapData:
 *   { city, year, week, value }
 *
 * value = toYear − fromYear (default 2026 − 2025).
 * If a city×week exists in only one year (or either value is missing), value is null.
 *
 * @param {Array<{ city: string, year: number, week: number, value: number }>} heatmapData
 * @param {number} [fromYear=2025]
 * @param {number} [toYear=2026]
 */
export function computeDiff(heatmapData, fromYear = 2025, toYear = 2026) {
  if (!heatmapData?.length) return [];

  // city|week → { city, week, from, to }
  const byCityWeek = new Map();

  for (const d of heatmapData) {
    if (d.year !== fromYear && d.year !== toYear) continue;

    const key = `${d.city}|${d.week}`;
    let entry = byCityWeek.get(key);
    if (!entry) {
      entry = { city: d.city, week: d.week, from: undefined, to: undefined };
      byCityWeek.set(key, entry);
    }

    if (d.year === fromYear) entry.from = d.value;
    if (d.year === toYear) entry.to = d.value;
  }

  const isMissing = (v) => v == null || Number.isNaN(v);

  return [...byCityWeek.values()]
    .sort((a, b) => a.city.localeCompare(b.city) || a.week - b.week)
    .map(({ city, week, from, to }) => ({
      city,
      // Keep a year field so weekKey / scales stay compatible with HeatMap.
      year: toYear,
      week,
      value: isMissing(from) || isMissing(to) ? null : to - from,
    }));
}

/**
 * Fetch both years via FetchData, then return the weekly difference rows.
 */
export async function fetchDiff(fromYear = 2025, toYear = 2026) {
  const [fromData, toData] = await Promise.all([
    fetchYearData(fromYear),
    fetchYearData(toYear),
  ]);
  return computeDiff([...fromData, ...toData], fromYear, toYear);
}

export default computeDiff;
