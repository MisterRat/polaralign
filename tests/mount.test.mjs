// Replays exact phone poses for every mounting mode through the app's geometry and checks that the
// measured polar-axis elevation, the Raise/Lower hint and the compass heading are right.
// Run with: node tests/mount.test.mjs
import assert from 'node:assert/strict';
import {
  normalizeAngle, getHeadingDifference, isParallelMount, planeTiltFrom, axisElevation, elevationHint, parallelMountProblem,
} from '../src/math.js';

const d2r = Math.PI / 180;
const unit = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// Device axes X (right), Y (top), Z (out of screen) in the Earth frame (x East, y North, z Up)
// -> W3C DeviceOrientation angles (R = Rz(alpha)·Rx(beta)·Ry(gamma), gamma in [-90, 90)).
function toEuler(X, Y, Z) {
  const gamma = Math.atan(-X[2] / Z[2]);
  const cb = Z[2] / Math.cos(gamma);
  const beta = Math.atan2(Y[2], cb);
  const alpha = Math.atan2(-Y[0] / cb, Y[1] / cb);
  return { alpha: normalizeAngle(alpha / d2r), beta: beta / d2r, gamma: gamma / d2r };
}

// Phone pose for a polar axis at (|lat| + elevErr) elevation, azErr from its pole, in a given mode.
function pose({ lat, mode, elevErr = 0, azErr = 0, turn = 0, upsideDown = false }) {
  const elev = Math.abs(lat) + elevErr;
  const az = (lat < 0 ? 180 : 0) + azErr;
  const p = [Math.sin(az * d2r) * Math.cos(elev * d2r), Math.cos(az * d2r) * Math.cos(elev * d2r), Math.sin(elev * d2r)];
  const side = unit(cross(p, [0, 0, 1]));
  const up = unit(cross(side, p));
  let X, Y, Z;
  if (mode === 'perpendicular') { Y = p; Z = up; }
  else { Z = mode === 'parallel' ? p.map((v) => -v) : p; Y = upsideDown ? up.map((v) => -v) : up; }
  X = cross(Y, Z);
  if (turn) {
    const c = Math.cos(turn * d2r), s = Math.sin(turn * d2r);
    if (mode === 'perpendicular') { // roll about the top edge
      [X, Z] = [X.map((v, i) => c * v - s * Z[i]), X.map((v, i) => s * v + c * Z[i])];
    } else { // turned in its own plane on the mount
      [X, Y] = [X.map((v, i) => c * v + s * Y[i]), Y.map((v, i) => -s * X[i] + c * v)];
    }
  }
  return toEuler(X, Y, Z);
}

// Same steps as src/app.jsx (portrait, declination 0).
function run({ alpha, beta, gamma }, lat, viking) {
  const parallel = isParallelMount(beta, viking);
  const measured = axisElevation({ pitch: Math.abs(beta), planeTilt: planeTiltFrom(beta, gamma), parallel });
  const heading = normalizeAngle(360 - alpha);
  const target = (viking ? !(lat < 0) : lat < 0) ? 180 : 0;
  return {
    parallel, measured,
    hint: elevationHint(measured, Math.abs(lat), { invert: parallel && viking }),
    azErr: getHeadingDifference(heading, target),
    problem: parallelMountProblem({ pitch: beta, roll: gamma, parallel }),
  };
}

let n = 0;
for (const lat of [52, 42, 30, 12, -20, -33]) {
  for (const mode of ['perpendicular', 'parallel', 'viking']) {
    for (const elevErr of [-5, -2, 0, 2, 5]) {
      for (const azErr of [-7, 0, 4]) {
        const label = `${mode} lat=${lat} elevErr=${elevErr} azErr=${azErr}`;
        const r = run(pose({ lat, mode, elevErr, azErr }), lat, mode === 'viking');
        assert.equal(r.parallel, mode !== 'perpendicular', `${label}: mode detection`);
        assert.ok(Math.abs(r.measured - (Math.abs(lat) + elevErr)) < 1e-6, `${label}: measured ${r.measured}`);
        // Viking keeps its original (inverted) instruction; see elevationHint.
        const high = mode === 'viking' ? 'raise' : 'lower', low = mode === 'viking' ? 'lower' : 'raise';
        assert.equal(r.hint, elevErr > 1 ? high : elevErr < -1 ? low : 'locked', `${label}: hint`);
        assert.ok(Math.abs(r.azErr + azErr) < 1e-6, `${label}: azimuth error ${r.azErr}`);
        assert.equal(r.problem, null, `${label}: no mount warning`);
        n++;
      }
    }
  }
}

// A phone rolled in a Perpendicular mount must stay in Perpendicular mode and read correctly.
for (const lat of [42, 30, -25]) for (const turn of [-30, 20, 40]) {
  const r = run(pose({ lat, mode: 'perpendicular', turn }), lat, false);
  assert.equal(r.parallel, false, `rolled perpendicular lat=${lat} turn=${turn} stays perpendicular`);
  assert.ok(Math.abs(r.measured - Math.abs(lat)) < 1e-6 && Math.abs(r.azErr) < 1e-6 && r.hint === 'locked');
  n++;
}

// Parallel modes: turning the phone in its mount leaves the elevation right but skews the heading,
// so the app must warn; an upside-down phone must be flagged too.
for (const mode of ['parallel', 'viking']) {
  const turned = run(pose({ lat: 42, mode, turn: 20 }), 42, mode === 'viking');
  assert.ok(Math.abs(turned.measured - 42) < 1e-6, `${mode} turned: elevation still right`);
  assert.equal(turned.problem, 'turned', `${mode} turned: warning`);
  const flipped = run(pose({ lat: 42, mode, upsideDown: true }), 42, mode === 'viking');
  assert.equal(flipped.problem, 'upside-down', `${mode} upside down: warning`);
  n += 2;
}

console.log(`Mounting geometry: ${n} poses checked.`);
