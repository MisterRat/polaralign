// Verifies the WMM2025 declination model (src/wmm.js) against NOAA's
// official WMM2025 test values. Run with: node tests/wmm.test.mjs
import { calculateMagneticDeclination } from '../src/wmm.js';

// NOAA WMM2025 test values: decimal year, height km, lat, lon, declination deg
// Source: https://www.ncei.noaa.gov/sites/default/files/2025-02/WMM2025testvalues.pdf
const NOAA = [
  [2025.0, 0, 80, 0, 1.28], [2025.0, 0, 0, 120, -0.16], [2025.0, 0, -80, 240, 68.78],
  [2025.0, 100, 80, 0, 0.85], [2025.0, 100, 0, 120, -0.15], [2025.0, 100, -80, 240, 68.21],
  [2027.5, 0, 80, 0, 2.59], [2027.5, 0, 0, 120, -0.24], [2027.5, 0, -80, 240, 68.49],
  [2027.5, 100, 80, 0, 2.16], [2027.5, 100, 0, 120, -0.23], [2027.5, 100, -80, 240, 67.93],
];

const fromDecimalYear = (y) => {
  const yr = Math.floor(y);
  const s = Date.UTC(yr, 0, 1), e = Date.UTC(yr + 1, 0, 1);
  return new Date(s + (y - yr) * (e - s));
};

let failures = 0;
for (const [yr, h, lat, lon, expected] of NOAA) {
  const got = calculateMagneticDeclination(lat, lon, h, fromDecimalYear(yr));
  const ok = Math.abs(got - expected) <= 0.01;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${yr} h=${h}km lat=${lat} lon=${lon}  expected ${expected}  got ${got}`);
}
if (failures) {
  console.error(`${failures} test value(s) outside 0.01 deg`);
  process.exit(1);
}
console.log('All NOAA WMM2025 test values match within 0.01 deg.');
