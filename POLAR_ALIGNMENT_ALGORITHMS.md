# Autonomous & Sensor-Driven Polar Alignment Algorithms

> **Engineering Reference Guide**  
> *Architectural overview, mathematical formulas, coordinate transforms, and sensor fusion algorithms for automated and semi-automated astronomical polar alignment systems.*

---

## 1. Executive Summary

Polar alignment is the process of aligning an equatorial mount or star tracker's axis of rotation parallel to Earth's rotational axis (pointing directly at the True Celestial Pole: **Polaris** in the Northern Hemisphere, **Sigma Octantis** in the Southern Hemisphere).

Traditional optical polar alignment relies on polar finderscopes or camera-based plate solving (e.g., SharpCap, ASIAIR). However, autonomous or sensor-assisted systems rely on **MEMS accelerometers, 3-axis magnetometers (electronic compasses), and GPS/GNSS receivers** to achieve rapid alignment without optical line-of-sight to the stars.

This document details the complete mathematical and algorithmic pipeline utilized in sensor-driven polar alignment systems, structured specifically for embedded developers, firmware engineers, and robotics researchers building autonomous telescope mounts.

---

## 2. High-Level System Architecture

```
                               ┌─────────────────────────┐
                               │     GPS / GNSS Module   │
                               └────────────┬────────────┘
                                            │ Latitude (ϕ), Longitude (λ)
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

### 3.1. Geomagnetic Declination Modeling

Magnetic compasses measure **Magnetic North**, which deviates from **True North** by the **Magnetic Declination ($\delta$)**. Declination varies dynamically based on geographic coordinates ($\phi, \lambda$) and epoch time.

#### Mathematical Model
In lightweight embedded environments where full NOAA World Magnetic Model (WMM) spherical harmonic coefficients ($N=12$) are too memory-intensive, an empirical multi-region trigonometric approximation is applied:

1. **Global Base Coordinate Model:**
   $$\delta_{\text{base}} = 0.17 \cdot \sin\left(\lambda \cdot \frac{\pi}{180}\right) \cdot \cos\left(\phi \cdot \frac{\pi}{180}\right) - 0.05 \cdot \left(\frac{\lambda}{30}\right) + \text{HemisphereOffset}(\phi)$$

   $$\text{Where } \text{HemisphereOffset}(\phi) = \begin{cases} 0.0008 \cdot \phi & \text{if } \phi \ge 0 \text{ (Northern)} \\ -0.0012 \cdot \phi & \text{if } \phi < 0 \text{ (Southern)} \end{cases}$$

2. **Regional Polynomial Corrections (High Density Observation Zones):**
   * **North America ($20^\circ \le \phi \le 65^\circ, -170^\circ \le \lambda \le -50^\circ$):**
     $$\delta_{\text{US}} = -0.15 \cdot (\lambda + 95) + 0.05 \cdot (\phi - 40)$$
     $$\delta_{\text{final}} = 0.8 \cdot \delta_{\text{US}} + 0.2 \cdot \delta_{\text{base}}$$

   * **Europe ($35^\circ \le \phi \le 70^\circ, -10^\circ \le \lambda \le 40^\circ$):**
     $$\delta_{\text{final}} = 3.0 + 0.08 \cdot (\lambda - 10) - 0.05 \cdot (\phi - 50)$$

#### TypeScript Reference Implementation
```typescript
function calculateMagneticDeclination(lat: number, lon: number): number {
  const rad = Math.PI / 180;
  const dec = 0.17 * Math.sin(lon * rad) * Math.cos(lat * rad) 
            - 0.05 * (lon / 30) 
            + (lat > 0 ? 0.0008 * lat : -0.0012 * lat);

  // US Regional Correction
  if (lat >= 20 && lat <= 65 && lon >= -170 && lon <= -50) {
    const usApprox = -0.15 * (lon + 95) + 0.05 * (lat - 40);
    return Math.round((usApprox * 0.8 + dec * 0.2) * 10) / 10;
  }
  // Europe Regional Correction
  if (lat >= 35 && lat <= 70 && lon >= -10 && lon <= 40) {
    const euApprox = 3.0 + 0.08 * (lon - 10) - 0.05 * (lat - 50);
    return Math.round(euApprox * 10) / 10;
  }
  return Math.round(dec * 10) / 10;
}
```

---

### 3.2. Azimuth Alignment & Shortest-Path Heading Differential

#### Coordinate Definitions
* **True Heading ($H_{\text{true}}$):** Heading relative to True Geographic North.
* **Target Bearing ($B_{\text{target}}$):** $0^\circ$ (True North) for Northern Hemisphere ($\phi \ge 0$), $180^\circ$ (True South) for Southern Hemisphere ($\phi < 0$).

#### Formulae
$$\text{Magnetic Heading: } H_{\text{mag}} = \text{Norm}_{360}(\text{Raw Magnetometer Heading})$$

$$\text{True Heading: } H_{\text{true}} = \text{Norm}_{360}(H_{\text{mag}} + \delta)$$

$$\text{Shortest Angular Difference: } \Delta Az = (B_{\text{target}} - H_{\text{true}}) \pmod{360}$$

$$\text{Shortest Path Wrap: } \Delta Az = \begin{cases} \Delta Az - 360 & \text{if } \Delta Az > 180 \\ \Delta Az + 360 & \text{if } \Delta Az < -180 \\ \Delta Az & \text{otherwise} \end{cases}$$

#### Actuator Directive Decision Table
| Differential $\Delta Az$ | Rotation Directive | Physical Meaning |
| :--- | :--- | :--- |
| $\Delta Az > 0$ | **Rotate Base RIGHT (CW)** | Mount is pointing West of Celestial Pole |
| $\Delta Az < 0$ | **Rotate Base LEFT (CCW)** | Mount is pointing East of Celestial Pole |
| $|\Delta Az| \le 1.5^\circ$ | **AZIMUTH LOCKED ✓** | Pointed within tolerance of True Celestial Pole |

---

### 3.3. Elevation / Altitude Wedge Tilt Alignment

Polar elevation angle is equal to the user's geographic latitude absolute value:

$$Alt_{\text{target}} = |\phi|$$

#### IMU Pitch Extraction & Mounting Geometry Mapping
Depending on the physical mounting orientation of the sensor enclosure relative to the telescope mount, pitch ($\beta$) and roll ($\gamma$) angles must be mapped:

1. **Standard Flat Mounting (Sensors parallel to horizon):**
   $$Alt_{\text{measured}} = |\text{Pitch}|$$

2. **Inverted / Parallel Pole-Facing Mount (Pitch $> 90^\circ$):**
   $$Alt_{\text{measured}} = |180^\circ - \text{Pitch}|$$

3. **Altitude Error Differential ($\Delta Alt$):**
   $$\Delta Alt = Alt_{\text{measured}} - Alt_{\text{target}}$$

#### Actuator Directive Decision Table
| Differential $\Delta Alt$ | Actuator Directive | Physical Meaning |
| :--- | :--- | :--- |
| $\Delta Alt > 0$ | **Lower Wedge Tilt ⬇** | Mount axis elevated too high above horizon |
| $\Delta Alt < 0$ | **Raise Wedge Tilt ⬆** | Mount axis pointing too low relative to pole |
| $|\Delta Alt| \le 1.0^\circ$ | **ALTITUDE LOCKED ✓** | Altitude matched to target geographic latitude |

---

### 3.4. Adaptive Low-Pass Noise Filtering (Dynamic Alpha EMA)

Raw MEMS sensor streams suffer from high-frequency electromagnetic noise, thermal drift, and human touch jitter. A standard Exponential Moving Average (EMA) causes lag when moving rapidly, but insufficient smoothing when static.

To resolve this, an **Adaptive Dynamic Alpha EMA Filter** adjusts the coefficient $\alpha$ dynamically based on instantaneous angular velocity:

$$\theta_{\text{smoothed}, t} = \theta_{\text{smoothed}, t-1} + \Delta\theta \cdot \alpha(\Delta\theta)$$

$$\text{Where } \Delta\theta = (\theta_{\text{raw}, t} - \theta_{\text{smoothed}, t-1}) \pmod{360}$$

#### Dynamic Alpha Mapping Function:
$$\alpha(\Delta\theta) = \begin{cases} 
0.06 & \text{if } |\Delta\theta| < 0.5^\circ \quad \text{(High damping while stationary)} \\
0.22 & \text{if } |\Delta\theta| > 4.0^\circ \quad \text{(Fast response during rapid motor slew)} \\
0.06 + (|\Delta\theta| - 0.5) \cdot 0.045 & \text{otherwise (Smooth linear interpolation)}
\end{cases}$$

```typescript
function adaptiveLowPassFilter(raw: number, currentSmoothed: number): number {
  let diff = (raw - currentSmoothed) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  
  const absDiff = Math.abs(diff);
  // Dynamic alpha computation
  const alpha = absDiff < 0.5 ? 0.06 : (absDiff > 4.0 ? 0.22 : 0.06 + (absDiff - 0.5) * 0.045);
  
  return (currentSmoothed + diff * alpha + 360) % 360;
}
```

---

### 3.5. Linear Acceleration & Mount Stability Analysis

Autonomous telescopes require structural stability before astrophotography exposures can begin. Wind gusts, cable drag, or motor movement introduce micro-vibrations.

#### Gravity Separation High-Pass Filter
The total acceleration measured by a 3-axis accelerometer ($\mathbf{a}_{\text{raw}}$) contains both constant Earth gravity ($\mathbf{g}$) and dynamic linear acceleration ($\mathbf{a}_{\text{linear}}$):

$$\mathbf{a}_{\text{raw}} = \mathbf{g} + \mathbf{a}_{\text{linear}}$$

1. **Estimate Gravity Vector using Low-Pass Filtering ($\alpha_g = 0.95$):**
   $$\mathbf{g}_t = \alpha_g \mathbf{g}_{t-1} + (1 - \alpha_g) \mathbf{a}_{\text{raw}, t}$$

2. **Isolate Dynamic Vibration Acceleration Vector:**
   $$\mathbf{a}_{\text{linear}, t} = \mathbf{a}_{\text{raw}, t} - \mathbf{g}_t$$

3. **Compute Vibration Vector Magnitude ($|\mathbf{a}_{\text{linear}}|$):**
   $$\|\mathbf{a}_{\text{linear}}\| = \sqrt{a_{lx}^2 + a_{ly}^2 + a_{lz}^2} \quad (\text{in } \text{m/s}^2)$$

4. **Normalized Sensitivity Scaling Against Noise Floor:**
   $$\text{Usable Range } R = M_{\text{max}} - 0.01 \cdot M_{\text{max}}$$
   $$\text{Vibration Strength } (\%) = \min\left(100, \max\left(0, \frac{\max(0, \|\mathbf{a}_{\text{linear}}\| - 0.01 \cdot M_{\text{max}})}{R} \times 100\right)\right)$$

   *Where $M_{\text{max}}$ is the configurable trip sensitivity threshold (default $1.0\text{ m/s}^2$).*

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
   │   |ΔAz| > 1.5°   │                  │   |ΔAlt| > 1.0°  │
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
   │    (Sidereal Speed = 15.041"/sec)                      │
   └────────────────────────────────────────────────────────┘
```

### 4.2. Mitigation of Electromagnetic Anomaly Disturbances
* **Soft-Iron & Hard-Iron Calibration:** Magnetometers mounted near electric stepper motors experience magnetic bias. A compulsory "Figure 8" rotation calibration procedure updates 3D offset matrices prior to aligning.
* **Separation Distance:** Mount magnetometer sensors at least 15 cm away from high-current motor drivers and ferrous metal components (e.g. steel counterweight shafts).
* **Dual-Sensor Fusion Option:** Combine 3-axis magnetometer reading with an optical gyro rate sensor ($d\theta/dt$) for dead-reckoning during rapid motor slews.

---

## 5. Summary Checklist for Implementation

| Algorithm Module | Formula / Logic | Target Tolerance | Primary Purpose |
| :--- | :--- | :--- | :--- |
| **Geomagnetic Declination** | Empirical Trigonometric WMM | $\pm 0.1^\circ$ | Convert Magnetic Compass to True Geographical Heading |
| **Azimuth Differential** | $\Delta Az = (B_{\text{target}} - H_{\text{true}}) \pmod{360}$ | $\le 1.5^\circ$ | Drive Left/Right Base Rotation |
| **Elevation Differential** | $\Delta Alt = |\text{Pitch}| - |\phi|$ | $\le 1.0^\circ$ | Drive Up/Down Altitude Wedge |
| **Adaptive EMA Filter** | $\alpha = f(|\Delta\theta|)$ | Dynamic ($0.06 \to 0.22$) | Smooth high-frequency noise without phase delay |
| **Gravity Separation** | $\mathbf{a}_{\text{linear}} = \mathbf{a}_{\text{raw}} - \mathbf{g}_t$ | $< 0.05 \text{ m/s}^2$ | Monitor tripod/mount physical stability |

---
*Document produced for developers and engineers building autonomous astronomical positioning systems.*
