// Unit checks for angle helpers and filters, plus release-version consistency.
// Run with: node tests/math.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeAngle, getHeadingDifference, smoothAngle, smoothLinear } from '../src/math.js';

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

// Angle helpers
assert.equal(normalizeAngle(-10), 350);
assert.equal(normalizeAngle(725), 5);
assert.equal(getHeadingDifference(350, 10), 20);
assert.equal(getHeadingDifference(10, 350), -20);
assert.equal(getHeadingDifference(0, 180), 180);

// Heading filter wraps through north instead of swinging the long way round
let h = smoothAngle(null, 359);
for (let i = 0; i < 200; i++) h = smoothAngle(h, 1);
assert.ok(getHeadingDifference(h, 1) < 0.01, `heading should settle at 1°, got ${h}`);

// Tilt filter converges and is damped for small noise
let p = smoothLinear(null, 30);
for (let i = 0; i < 300; i++) p = smoothLinear(p, 40);
assert.ok(Math.abs(p - 40) < 0.01, `pitch should settle at 40°, got ${p}`);
assert.ok(Math.abs(smoothLinear(30, 30.2) - 30) < 0.02, 'small jitter should be heavily damped');

// Release version must match everywhere the browser caches by it
const version = JSON.parse(read('package.json')).version;
assert.ok(read('sw.js').includes(`const APP_VERSION = '${version}'`), 'sw.js APP_VERSION must match package.json');
assert.ok(read('index.html').includes(`./app.js?v=${version}`), 'index.html app.js?v= must match package.json');

console.log('Math and version checks passed.');
