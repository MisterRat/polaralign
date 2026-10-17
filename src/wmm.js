// Official NOAA/BGS World Magnetic Model WMM2025 (epoch 2025.0, valid 2025.0-2030.0).
// Rows: [n, m, g_nm, h_nm, gdot_nm, hdot_nm] in nT and nT/year, copied verbatim from WMM2025.COF.
// Verified against NOAA's published WMM2025 test values (see tests/wmm.test.mjs).
export const WMM2025_EPOCH = 2025.0;
export const WMM2025_VALID_UNTIL = 2030.0;
const WMM2025_COEFFS = [
  [1,0,-29351.8,0.0,12.0,0.0],[1,1,-1410.8,4545.4,9.7,-21.5],
  [2,0,-2556.6,0.0,-11.6,0.0],[2,1,2951.1,-3133.6,-5.2,-27.7],[2,2,1649.3,-815.1,-8.0,-12.1],
  [3,0,1361.0,0.0,-1.3,0.0],[3,1,-2404.1,-56.6,-4.2,4.0],[3,2,1243.8,237.5,0.4,-0.3],[3,3,453.6,-549.5,-15.6,-4.1],
  [4,0,895.0,0.0,-1.6,0.0],[4,1,799.5,278.6,-2.4,-1.1],[4,2,55.7,-133.9,-6.0,4.1],[4,3,-281.1,212.0,5.6,1.6],[4,4,12.1,-375.6,-7.0,-4.4],
  [5,0,-233.2,0.0,0.6,0.0],[5,1,368.9,45.4,1.4,-0.5],[5,2,187.2,220.2,0.0,2.2],[5,3,-138.7,-122.9,0.6,0.4],[5,4,-142.0,43.0,2.2,1.7],[5,5,20.9,106.1,0.9,1.9],
  [6,0,64.4,0.0,-0.2,0.0],[6,1,63.8,-18.4,-0.4,0.3],[6,2,76.9,16.8,0.9,-1.6],[6,3,-115.7,48.8,1.2,-0.4],[6,4,-40.9,-59.8,-0.9,0.9],[6,5,14.9,10.9,0.3,0.7],[6,6,-60.7,72.7,0.9,0.9],
  [7,0,79.5,0.0,-0.0,0.0],[7,1,-77.0,-48.9,-0.1,0.6],[7,2,-8.8,-14.4,-0.1,0.5],[7,3,59.3,-1.0,0.5,-0.8],[7,4,15.8,23.4,-0.1,0.0],[7,5,2.5,-7.4,-0.8,-1.0],[7,6,-11.1,-25.1,-0.8,0.6],[7,7,14.2,-2.3,0.8,-0.2],
  [8,0,23.2,0.0,-0.1,0.0],[8,1,10.8,7.1,0.2,-0.2],[8,2,-17.5,-12.6,0.0,0.5],[8,3,2.0,11.4,0.5,-0.4],[8,4,-21.7,-9.7,-0.1,0.4],[8,5,16.9,12.7,0.3,-0.5],[8,6,15.0,0.7,0.2,-0.6],[8,7,-16.8,-5.2,-0.0,0.3],[8,8,0.9,3.9,0.2,0.2],
  [9,0,4.6,0.0,-0.0,0.0],[9,1,7.8,-24.8,-0.1,-0.3],[9,2,3.0,12.2,0.1,0.3],[9,3,-0.2,8.3,0.3,-0.3],[9,4,-2.5,-3.3,-0.3,0.3],[9,5,-13.1,-5.2,0.0,0.2],[9,6,2.4,7.2,0.3,-0.1],[9,7,8.6,-0.6,-0.1,-0.2],[9,8,-8.7,0.8,0.1,0.4],[9,9,-12.9,10.0,-0.1,0.1],
  [10,0,-1.3,0.0,0.1,0.0],[10,1,-6.4,3.3,0.0,0.0],[10,2,0.2,0.0,0.1,-0.0],[10,3,2.0,2.4,0.1,-0.2],[10,4,-1.0,5.3,-0.0,0.1],[10,5,-0.6,-9.1,-0.3,-0.1],[10,6,-0.9,0.4,0.0,0.1],[10,7,1.5,-4.2,-0.1,0.0],[10,8,0.9,-3.8,-0.1,-0.1],[10,9,-2.7,0.9,-0.0,0.2],[10,10,-3.9,-9.1,-0.0,-0.0],
  [11,0,2.9,0.0,0.0,0.0],[11,1,-1.5,0.0,-0.0,-0.0],[11,2,-2.5,2.9,0.0,0.1],[11,3,2.4,-0.6,0.0,-0.0],[11,4,-0.6,0.2,0.0,0.1],[11,5,-0.1,0.5,-0.1,-0.0],[11,6,-0.6,-0.3,0.0,-0.0],[11,7,-0.1,-1.2,-0.0,0.1],[11,8,1.1,-1.7,-0.1,-0.0],[11,9,-1.0,-2.9,-0.1,0.0],[11,10,-0.2,-1.8,-0.1,0.0],[11,11,2.6,-2.3,-0.1,0.0],
  [12,0,-2.0,0.0,0.0,0.0],[12,1,-0.2,-1.3,0.0,-0.0],[12,2,0.3,0.7,-0.0,0.0],[12,3,1.2,1.0,-0.0,-0.1],[12,4,-1.3,-1.4,-0.0,0.1],[12,5,0.6,-0.0,-0.0,-0.0],[12,6,0.6,0.6,0.1,-0.0],[12,7,0.5,-0.1,-0.0,-0.0],[12,8,-0.1,0.8,0.0,0.0],[12,9,-0.4,0.1,0.0,-0.0],[12,10,-0.2,-1.0,-0.1,-0.0],[12,11,-1.3,0.1,-0.0,0.0],[12,12,-0.7,0.2,-0.1,-0.1]
];

export function toDecimalYear(date) {
  const y = date.getUTCFullYear();
  const start = Date.UTC(y, 0, 1);
  const end = Date.UTC(y + 1, 0, 1);
  return y + (date.getTime() - start) / (end - start);
}

// Magnetic declination (degrees, positive = East of True North) from the WMM2025 spherical-harmonic model,
// including secular variation for the given date. altKm is height above the WGS84 ellipsoid in km.
export function calculateMagneticDeclination(lat, lon, altKm = 0, date = new Date()) {
  const r2d = 180 / Math.PI;
  const d2r = Math.PI / 180;
  const a = 6371.2; // WMM geomagnetic reference radius (km)
  const A = 6378.137; // WGS84 semi-major axis (km)
  const f = 1 / 298.257223563;
  const e2 = f * (2 - f);

  // Keep away from the exact geographic poles, where declination is undefined.
  const latC = Math.max(-89.9999, Math.min(89.9999, lat));
  const phi = latC * d2r;
  const lambda = lon * d2r;
  const dt = toDecimalYear(date) - WMM2025_EPOCH;

  // Geodetic -> geocentric spherical coordinates
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const Rc = A / Math.sqrt(1 - e2 * sinPhi * sinPhi);
  const p = (Rc + altKm) * cosPhi;
  const z = (Rc * (1 - e2) + altKm) * sinPhi;
  const r = Math.sqrt(p * p + z * z);
  const phiC = Math.asin(z / r); // geocentric latitude
  const colat = Math.PI / 2 - phiC;
  const st = Math.sin(colat);
  const ct = Math.cos(colat);

  const maxN = 12;
  const P = Array.from({ length: maxN + 1 }, () => new Float64Array(maxN + 1));
  const dP = Array.from({ length: maxN + 1 }, () => new Float64Array(maxN + 1));
  P[0][0] = 1;
  for (let n = 1; n <= maxN; n++) {
    for (let m = 0; m <= n; m++) {
      if (n === m) {
        P[n][n] = st * P[n - 1][n - 1];
        dP[n][n] = st * dP[n - 1][n - 1] + ct * P[n - 1][n - 1];
      } else if (n === 1 && m === 0) {
        P[1][0] = ct;
        dP[1][0] = -st;
      } else {
        const K = ((n - 1) * (n - 1) - m * m) / ((2 * n - 1) * (2 * n - 3));
        P[n][m] = ct * P[n - 1][m] - K * (n >= 2 ? P[n - 2][m] : 0);
        dP[n][m] = ct * dP[n - 1][m] - st * P[n - 1][m] - K * (n >= 2 ? dP[n - 2][m] : 0);
      }
    }
  }

  // Gauss -> Schmidt semi-normalization factors
  const S = Array.from({ length: maxN + 1 }, () => new Float64Array(maxN + 1));
  S[0][0] = 1;
  for (let n = 1; n <= maxN; n++) {
    S[n][0] = S[n - 1][0] * ((2 * n - 1) / n);
    for (let m = 1; m <= n; m++) {
      const delta = m === 1 ? 2 : 1;
      S[n][m] = S[n][m - 1] * Math.sqrt(((n - m + 1) * delta) / (n + m));
    }
  }

  // Field components in geocentric frame: Xc (north), Yc (east), Zc (down)
  let Xc = 0, Yc = 0, Zc = 0;
  for (const [n, m, g0, h0, gd, hd] of WMM2025_COEFFS) {
    const g = g0 + dt * gd;
    const h = h0 + dt * hd;
    const ar = Math.pow(a / r, n + 2);
    const Pnm = P[n][m] * S[n][m];
    const dPnm = dP[n][m] * S[n][m]; // d/d(colatitude)
    const cosM = Math.cos(m * lambda);
    const sinM = Math.sin(m * lambda);
    const gc = g * cosM + h * sinM;
    Xc += ar * gc * dPnm;
    Yc += ar * m * (g * sinM - h * cosM) * Pnm / st;
    Zc -= (n + 1) * ar * gc * Pnm;
  }

  // Rotate from geocentric to geodetic frame
  const psi = phiC - phi;
  const X = Xc * Math.cos(psi) - Zc * Math.sin(psi);
  const Y = Yc;

  const dec = Math.atan2(Y, X) * r2d;
  return Math.round(dec * 100) / 100;
}

export function isMagneticModelExpired(date = new Date()) {
  return toDecimalYear(date) >= WMM2025_VALID_UNTIL;
}

