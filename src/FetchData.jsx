import { mean, rollups } from "d3-array";
import { CITIES } from "./cities";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function yearDateRange(year) {
  const startDate = new Date(year, 0, 1).toISOString().split("T")[0];
  let endDate = new Date(year, 11, 31).toISOString().split("T")[0];
  const now = new Date().toISOString().split("T")[0];
  if (now < endDate) endDate = now;
  return { startDate, endDate };
}

function buildArchiveUrl(startDate, endDate) {
  // Dev: Vite proxy (same origin). Production: Open-Meteo directly.
  // Path must not be a prefix of vite `base` (`/open-meteo` would steal `/open-meteo-greece/`).
  const apiBase = import.meta.env.DEV
    ? "/api/open-meteo"
    : "https://archive-api.open-meteo.com";

  return (
    apiBase +
    "/v1/archive" +
    "?latitude=" +
    CITIES.map((c) => c.lat).join(",") +
    "&longitude=" +
    CITIES.map((c) => c.lon).join(",") +
    "&start_date=" +
    startDate +
    "&end_date=" +
    endDate +
    "&daily=temperature_2m_mean&timezone=auto"
  );
}

/**
 * Fetch weekly mean temperatures for one calendar year.
 * Returns heatmap rows: { city, year, week, value }
 */
export async function fetchYearData(year) {
  const { startDate, endDate } = yearDateRange(year);
  const url = buildArchiveUrl(startDate, endDate);

  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Open-Meteo responded ${response.status}: ${body}`);
  }

  const data = await response.json();
  const locations = Array.isArray(data) ? data : [data];

  // Week index restarts every calendar year (from that year's Jan 1).
  const daily = locations.flatMap((loc, i) =>
    loc.daily.time.map((t, j) => {
      const [y, m, d] = t.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      const yr = date.getFullYear();
      const yearStart = new Date(yr, 0, 1);
      const week = Math.floor((date - yearStart) / WEEK_MS);
      return {
        city: CITIES[i].name,
        year: yr,
        week,
        temp: loc.daily.temperature_2m_mean[j],
      };
    }),
  );

  return rollups(
    daily.filter((d) => d.temp != null && !Number.isNaN(d.temp)),
    (rows) => mean(rows, (d) => d.temp),
    (d) => d.city,
    (d) => d.year,
    (d) => d.week,
  ).flatMap(([city, byYear]) =>
    byYear.flatMap(([yr, byWeek]) =>
      byWeek.map(([week, value]) => ({ city, year: yr, week, value })),
    ),
  );
}

export default fetchYearData;
