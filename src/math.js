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
