// Angle helpers and the adaptive low-pass filter used for all sensor channels.

export function normalizeAngle(angle) {
  let norm = angle % 360;
  if (norm < 0) norm += 360;
  return norm;
}

// Signed shortest-path difference from `current` to `target`, in the range [-180, 180].
export function getHeadingDifference(current, target) {
  let diff = (target - current) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}

// Filter profiles: below `still` degrees of change the filter damps heavily (alphaMin);
// above `moving` it follows quickly (alphaMax); in between it interpolates linearly.
export const HEADING_FILTER = { still: 1.0, moving: 6.0, alphaMin: 0.06, alphaMax: 0.22 };
export const TILT_FILTER = { still: 0.5, moving: 4.0, alphaMin: 0.06, alphaMax: 0.22 };

export function adaptiveAlpha(absDiff, profile) {
  const { still, moving, alphaMin, alphaMax } = profile;
  if (absDiff <= still) return alphaMin;
  if (absDiff >= moving) return alphaMax;
  return alphaMin + ((absDiff - still) / (moving - still)) * (alphaMax - alphaMin);
}

// Adaptive exponential moving average for a linear quantity (pitch, roll, tilt).
export function smoothLinear(previous, raw, profile = TILT_FILTER) {
  if (previous === null || previous === undefined || Number.isNaN(previous)) return raw;
  const diff = raw - previous;
  return previous + diff * adaptiveAlpha(Math.abs(diff), profile);
}

// Adaptive exponential moving average for a compass angle, wrapping correctly through 0/360.
export function smoothAngle(previous, raw, profile = HEADING_FILTER) {
  if (previous === null || previous === undefined || Number.isNaN(previous)) return normalizeAngle(raw);
  const diff = getHeadingDifference(previous, raw);
  return normalizeAngle(previous + diff * adaptiveAlpha(Math.abs(diff), profile));
}

// ---- Mounting geometry -------------------------------------------------------------------------
// pitch = device beta, roll = device gamma (degrees, W3C DeviceOrientation conventions).
// planeTilt = angle between the screen and the horizontal, acos(|cos(beta)·cos(gamma)|).
//
// Perpendicular mode: the phone's top edge lies along the polar axis (screen up). The top edge's
//   elevation is exactly |beta| (180 - |beta| past vertical), whatever the phone's roll.
// Parallel modes (Normal: screen down, back toward the pole; Viking: screen up, back toward the
//   opposite pole): the screen normal lies along the polar axis, so the axis elevation is
//   90° - planeTilt, again independent of how the phone is turned in its mount.

// Normal Parallel puts the phone past vertical (|beta| > 90). Viking is only chosen explicitly,
// because its pose looks like Perpendicular mode to the sensors.
export function isParallelMount(pitch, vikingMode) {
  return Boolean(vikingMode) || Math.abs(pitch) > 90;
}

export function planeTiltFrom(pitch, roll) {
  const d2r = Math.PI / 180;
  const c = Math.abs(Math.cos(pitch * d2r) * Math.cos(roll * d2r));
  return Math.acos(Math.min(1, c)) / d2r;
}

export function axisElevation({ pitch, planeTilt, parallel }) {
  if (parallel) return 90 - planeTilt;
  const a = Math.abs(pitch);
  return a > 90 ? 180 - a : a;
}

// Raise/Lower instruction from the elevation error. Viking mode uses the opposite direction
// (invert: true), matching how it has been used in the field.
export function elevationHint(measured, target, { toleranceDeg = 1.0, invert = false } = {}) {
  const err = measured - target;
  if (Math.abs(err) <= toleranceDeg) return 'locked';
  const tooHigh = invert ? err < 0 : err > 0;
  return tooHigh ? 'lower' : 'raise';
}

// In the parallel modes the compass reads the direction of the phone's top edge, which only
// matches the polar axis when the top edge points straight up and the phone is not turned
// in its mount. Returns 'upside-down', 'turned' or null.
export const PARALLEL_TURN_WARN_DEG = 3;
export function parallelMountProblem({ pitch, roll, parallel }) {
  if (!parallel) return null;
  if (pitch < 0) return 'upside-down';
  if (Math.abs(roll) > PARALLEL_TURN_WARN_DEG) return 'turned';
  return null;
}
