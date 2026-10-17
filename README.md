# Autonomous & Sensor-Driven Polar Alignment Algorithms

> **Engineering Reference Guide**  
> *Architectural overview, mathematical formulas, coordinate transforms, and sensor fusion algorithms for automated and semi-automated astronomical polar alignment systems.*

---

## Using the app

1. Open the app on your phone in Chrome (Android) or Safari (iOS) and tap **Acquire GPS & Sensor Access**. Allow location and motion access. If GPS is unavailable you can type your latitude and longitude instead.
2. Mount the phone on the tracker or mount so its top edge points along the polar axis (screen up), or flat on the mount plate for parallel mode.
3. Tap **Calibrate** and follow the figure-8 motion until the bar fills. Keep the phone away from metal, magnets and motors while you do it.
4. Turn the mount base until **Azimuth Alignment** shows LOCKED, then adjust the wedge until **Elevation** shows LOCKED.
5. Optionally start the **Mount Stability Monitor** to check that vibration has settled before imaging.

If the azimuth card says **No compass signal**, the browser is not providing a north-referenced compass heading and no azimuth guidance is shown. If it warns that compass accuracy is too coarse (iOS reports this), recalibrate away from interference.

## Development

The app source lives in `src/` and is compiled to `app.js` with esbuild. The site is served straight from the repository root (GitHub Pages), so commit the rebuilt `app.js` with every change.

```bash
npm install
npm run build   # compile src/ -> app.js
npm test        # NOAA WMM2025 test values, filter and version checks
```

When releasing, bump the version in `package.json`, `sw.js` (`APP_VERSION`) and the `app.js?v=` query in `index.html`; `npm test` fails if they disagree.

## 1. Executive Summary

Polar alignment is the process of aligning an equatorial mount or star tracker's axis of rotation parallel to Earth's rotational axis (pointing directly at the True Celestial Pole: which is close to **Polaris** in the Northern Hemisphere, **Sigma Octantis** in the Southern Hemisphere).

Traditional optical polar alignment relies on polar finderscopes or camera-based plate solving (e.g., SharpCap, ASIAIR). However, autonomous or sensor-assisted systems rely on **MEMS accelerometers, 3-axis magnetometers (electronic compasses), and GPS/GNSS receivers** to achieve rapid alignment without optical line-of-sight to the stars.

This document details the complete mathematical and algorithmic pipeline utilized in sensor-driven polar alignment systems, structured specifically for embedded developers, firmware engineers, and robotics researchers building autonomous telescope mounts.

---

## 2. High-Level System Architecture

```
                               ┌─────────────────────────┐
                               │     GPS / GNSS Module   │
                               └────────────┬────────────┘
                                            │ Latitude (lat), Longitude (lon)
                                            ▼
                               ┌─────────────────────────┐
                               │ Geomagnetic Model (WMM) │
                               └────────────┬────────────┘
                                            │ Magnetic Declination (δ)
                                            ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│ Magnetometer Sensors    ├─►──┤ True Heading Matrix     ├─►──┐
│ (3-Axis Compass)        │    └─────────────────────────┘    │
└─────────────────────────┘                                   │
                                                              ├─►  Azimuth Correction ΔAz
┌─────────────────────────┐    ┌─────────────────────────┐    │    (Stepper / Motor Control)
│ Accelerometer Sensors   ├─►──┤ Pitch / Altitude Filter ├─►──┤
│ (Inclinometer / IMU)    │    └─────────────────────────┘    │
└─────────────────────────┘                                   │
                                                              ├─►  Elevation Correction ΔAlt
┌─────────────────────────┐    ┌─────────────────────────┐    │    (Wedge Actuator)
│ Vibration Monitor       ├─►──┤ High-Pass Linear Accel  ├─►──┘
│ (Linear Accelerometer)  │    └─────────────────────────┘
└─────────────────────────┘
```

---

## 3. Core Algorithms & Mathematical Formulations

### 3.1. Official NOAA World Magnetic Model (WMM2025) Spherical Harmonics Matrix

Magnetic compasses measure **Magnetic North**, which deviates from **True North** by the **Magnetic Declination (`δ`)**. Declination varies dynamically based on geographic coordinates (`lat`, `lon`) and altitude.

#### Mathematical Model
Simple polar alignment apps frequently suffer from inaccuracies or require internet connections to look up magnetic declination. To work fully offline, this app embeds the official **NOAA/BGS World Magnetic Model WMM2025** (epoch 2025.0, valid until 2030.0): all 90 Gauss coefficients to degree $N=12$ plus their secular-variation (yearly change) terms, evaluated for the current date and the GPS altitude.

The implementation reproduces NOAA's published WMM2025 test values to within 0.01° (`tests/wmm.test.mjs`). The model itself has a typical uncertainty of a few tenths of a degree, larger near the magnetic poles and over local magnetic anomalies. After 1 January 2030 the app warns that the model has expired.

1. **Geodetic to Spherical Colatitude Conversion:**
   ```text
   phi = lat * (π / 180)
   lambda = lon * (π / 180)
   
   Rc = a / sqrt(1 - e^2 * sin^2(phi))
   p = (Rc + alt) * cos(phi)
   z = (Rc * (1 - e^2) + alt) * sin(phi)
   r = sqrt(p^2 + z^2)
   colat = atan2(p, z)
   ```

2. **Associated Legendre Polynomials ($P_n^m$) & Schmidt Semi-Normalization:**
   Recursively computes normalized Legendres $P_n^m(\cos \theta)$ and derivatives $\frac{dP_n^m}{d\theta}$ up to degree $N=12$.

3. **Geomagnetic Vector Field Extraction ($B_x, B_y$):**
   ```text
   B_north = -B_theta * cos(psi) - B_r * sin(psi)
   B_east  = -B_phi
   Declination = atan2(B_east, B_north) * (180 / π)
   ```

#### TypeScript / JavaScript Implementation
```javascript
// src/wmm.js — 90 rows [n, m, g_nm, h_nm, gdot_nm, hdot_nm] copied from WMM2025.COF
const WMM2025_COEFFS = [
  [1,0,-29351.8,0.0,12.0,0.0],[1,1,-1410.8,4545.4,9.7,-21.5],
  // ... through degree 12
];

// g(t) = g + (t - 2025.0) * gdot, evaluated at reference radius a = 6371.2 km
function calculateMagneticDeclination(lat, lon, altKm = 0, date = new Date()) {
  // Returns magnetic declination in degrees, positive East of True North
}
```

---

### 3.2. Azimuth Alignment & Shortest-Path Heading Differential

#### Coordinate Definitions
* **True Heading (`H_true`):** Heading relative to True Geographic North.
* **Target Bearing (`B_target`):** `0°` (True North) for Northern Hemisphere (`lat >= 0`), `180°` (True South) for Southern Hemisphere (`lat < 0`).

#### Formulas
```text
Magnetic Heading:  H_mag  = Norm360(Raw Magnetometer Heading)
True Heading:      H_true = Norm360(H_mag + δ)
Angular Diff:      ΔAz    = (B_target - H_true) mod 360

Shortest Path Wrap:
  ΔAz = ΔAz - 360   if ΔAz > 180
  ΔAz = ΔAz + 360   if ΔAz < -180
```

#### Actuator Directive Decision Table
| Differential `ΔAz` | Rotation Directive | Physical Meaning |
| :--- | :--- | :--- |
| `ΔAz > 0` | **Rotate Base RIGHT (CW)** | Mount is pointing West of Celestial Pole |
| `ΔAz < 0` | **Rotate Base LEFT (CCW)** | Mount is pointing East of Celestial Pole |
| `abs(ΔAz) <= 1.5°` | **AZIMUTH LOCKED ✓** | Pointed within tolerance of True Celestial Pole |

---

### 3.3. Elevation / Altitude Wedge Tilt Alignment

Polar elevation angle is equal to the absolute value of the user's geographic latitude:

```text
Alt_target = abs(lat)
```

#### IMU Pitch Extraction & Mounting Geometry Mapping
Depending on the physical mounting orientation of the sensor enclosure relative to the telescope mount, pitch (`β`) and roll (`γ`) angles are mapped as follows:

1. **Standard Perpendicular Mounting (Screen UP, Top pointing at Celestial Pole):**
   ```text
   Alt_measured = abs(Pitch)
   ```

2. **Inverted Mount (`Pitch > 90°`):**
   ```text
   Alt_measured = abs(180° - Pitch)
   ```

3. **Parallel Mounting (Normal Parallel & Viking Mode):**
   When the phone is attached parallel to the tracker mount plate or dovetail, the phone's long axis sits orthogonal ($90^\circ$) to the polar axis:
   ```text
   Alt_measured = |90° - Pitch|
   ```

4. **Altitude Error Differential (`ΔAlt`):**
   ```text
   Alt_target = abs(lat)
   ΔAlt = Alt_measured - Alt_target
   ```

#### Actuator Directive Decision Table
| Mounting Mode | Differential `ΔAlt` | Actuator Directive | Physical Meaning |
| :--- | :--- | :--- | :--- |
| **Normal (Perp & Parallel)** | `ΔAlt > 0` | **Lower Wedge Tilt ⬇** | Mount axis elevated too high above horizon |
| **Normal (Perp & Parallel)** | `ΔAlt < 0` | **Raise Wedge Tilt ⬆** | Mount axis pointing too low relative to pole |
| **Viking Mode (Parallel)** | `ΔAlt > 0` | **Raise Wedge Tilt ⬆** | Polar wedge needs to be raised towards opposite pole target |
| **Viking Mode (Parallel)** | `ΔAlt < 0` | **Lower Wedge Tilt ⬇** | Polar wedge needs to be lowered away from opposite pole target |
| **All Modes** | `abs(ΔAlt) <= 1.0°` | **ALTITUDE LOCKED ✓** | Altitude matched to target geographic latitude |

---

### 3.4. Adaptive Low-Pass Noise Filtering (Dynamic Alpha EMA)

Raw MEMS sensor streams suffer from high-frequency electromagnetic noise, thermal drift, and human touch jitter. One filter implementation (`src/math.js`) is used for every channel, with a slightly wider window for the compass heading. A standard Exponential Moving Average (EMA) causes lag when moving rapidly, but insufficient smoothing when static.

To resolve this, an **Adaptive Dynamic Alpha EMA Filter** adjusts the coefficient `α` dynamically based on instantaneous angular velocity:

```text
theta_smoothed[t] = theta_smoothed[t-1] + Δtheta * α(Δtheta)

Where Δtheta = (theta_raw[t] - theta_smoothed[t-1]) mod 360
```

#### Dynamic Alpha Mapping Function:
```text
α(Δtheta) =
  0.06                                     if abs(Δtheta) <= still   (High damping while stationary)
  0.22                                     if abs(Δtheta) >= moving  (Fast response during rapid motion)
  linear interpolation from 0.06 to 0.22   otherwise

Heading:     still = 1.0°, moving = 6.0°
Pitch/Roll:  still = 0.5°, moving = 4.0°
```

```javascript
// src/math.js
export function adaptiveAlpha(absDiff, { still, moving, alphaMin, alphaMax }) {
  if (absDiff <= still) return alphaMin;
  if (absDiff >= moving) return alphaMax;
  return alphaMin + ((absDiff - still) / (moving - still)) * (alphaMax - alphaMin);
}

export function smoothAngle(previous, raw, profile = HEADING_FILTER) {
  if (previous === null) return normalizeAngle(raw);
  const diff = getHeadingDifference(previous, raw); // shortest path through 0/360
  return normalizeAngle(previous + diff * adaptiveAlpha(Math.abs(diff), profile));
}
```

---

### 3.5. Linear Acceleration & Mount Stability Analysis

Autonomous telescopes require structural stability before astrophotography exposures can begin. Wind gusts, cable drag, or motor movement introduce micro-vibrations.

#### Gravity Separation High-Pass Filter
The total acceleration measured by a 3-axis accelerometer (`a_raw`) contains both constant Earth gravity (`g`) and dynamic linear acceleration (`a_linear`):

```text
a_raw = g + a_linear
```

1. **Estimate Gravity Vector using Low-Pass Filtering (`α_g = 0.95`):**
   ```text
   g[t] = α_g * g[t-1] + (1 - α_g) * a_raw[t]
   ```

2. **Isolate Dynamic Vibration Acceleration Vector:**
   ```text
   a_linear[t] = a_raw[t] - g[t]
   ```

3. **Compute Vibration Vector Magnitude (`|a_linear|`):**
   ```text
   ||a_linear|| = sqrt(a_lx^2 + a_ly^2 + a_lz^2)   (in m/s²)
   ```

4. **Normalized Sensitivity Scaling Against Noise Floor:**
   ```text
   Usable Range R = M_max - (0.01 * M_max)
   Vibration Strength (%) = min(100, max(0, (max(0, ||a_linear|| - 0.01 * M_max) / R) * 100))
   ```
   *Where `M_max` is the configurable trip sensitivity threshold (default `1.0 m/s²`).*

---

## 4. Hardware Integration Guidance for Autonomous Systems

For developers designing autonomous motorized mounts (stepper motor-driven Az/Alt alignment head):

### 4.1. Closed-Loop Control Logic

```
   ┌────────────────────────────────────────────────────────┐
   │ 1. Read GNSS Coordinates & Compute Target Declination  │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ 2. Sample IMU (Magnetometer + Accelerometer)           │
   │    Apply Adaptive EMA Low-Pass Filter                  │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ 3. Compute ΔAz and ΔAlt Error Differentials           │
   └───────────────────────────┬────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   ┌──────────────────┐                  ┌──────────────────┐
   │   abs(ΔAz) > 1.5°│                  │  abs(ΔAlt) > 1.0°│
   └────────┬─────────┘                  └────────┬─────────┘
            │ YES                                 │ YES
            ▼                                     ▼
┌───────────────────────┐             ┌───────────────────────┐
│ Drive Azimuth Stepper │             │ Drive Altitude Wedge  │
│ Motor (CW/CCW)        │             │ Linear Actuator       │
└───────────┬───────────┘             └───────────┬───────────┘
            │                                     │
            └──────────────────┬──────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ 4. Verify Vibration Strength < Threshold (< 5% M_max) │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ 5. Lock Alignment & Handover to Tracking Drive Rate    │
   │    (Sidereal Speed = 15.041 arcsec/sec)                │
   └────────────────────────────────────────────────────────┘
```

### 4.2. Mitigation of Electromagnetic Anomaly Disturbances
* **Soft-Iron & Hard-Iron Calibration:** Magnetometers mounted near electric stepper motors experience magnetic bias. Dedicated hardware should run a "Figure 8" rotation calibration that updates its 3D offset matrices before aligning. (In the phone app, a web page cannot run or open the OS calibration; the app's figure-8 wizard instead guides the phone through enough orientations for iOS/Android to recalibrate themselves, and on iOS it reports the resulting compass accuracy.)
* **Separation Distance:** Mount magnetometer sensors at least 15 cm away from high-current motor drivers and ferrous metal components (e.g. steel counterweight shafts).
* **Dual-Sensor Fusion Option:** Combine 3-axis magnetometer reading with an optical gyro rate sensor (`d_theta/dt`) for dead-reckoning during rapid motor slews.

---

## 5. Summary Checklist for Implementation

| Algorithm Module | Formula / Logic | Target Tolerance | Primary Purpose |
| :--- | :--- | :--- | :--- |
| **NOAA WMM2025 Magnetic Declination** | Official $N=12$ spherical harmonics with secular variation | Matches NOAA test values to `0.01°` | Offline conversion from magnetic to true heading worldwide |
| **Azimuth Differential** | `ΔAz = (B_target - H_true) mod 360` | `≤ 1.5°` | Drive Left/Right Base Rotation |
| **Elevation Differential** | `ΔAlt = (isParallel ? |90 - Pitch| : (Pitch > 90 ? |180 - Pitch| : Pitch)) - abs(lat)` | `≤ 1.0°` | Drive Up/Down Altitude Wedge across all mounting orientations |
| **Adaptive EMA Filter** | `α = f(abs(Δtheta))` | Dynamic (`0.06` to `0.22`) | Smooth high-frequency noise without phase delay |
| **Gravity Separation** | `a_linear = a_raw - g[t]` | `< 0.05 m/s²` | Monitor tripod/mount physical stability |

---
*Document produced for developers and engineers building autonomous astronomical positioning systems.*
