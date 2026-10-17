
// Simple Polar Align — application source.
// Built into ../app.js by `npm run build` (esbuild). React/ReactDOM are loaded as globals from ./vendor.
import { calculateMagneticDeclination, isMagneticModelExpired } from './wmm.js';
import { normalizeAngle, getHeadingDifference, smoothAngle, smoothLinear } from './math.js';

const { useState, useEffect, useRef } = React;

// React SVG Icon Component (Native JSX rendering - prevents DOM mutation crashes)
function Icon({ name, className = "w-4 h-4" }) {
  const props = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };

  switch (name) {
    case 'compass':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case 'rotate-cw':
      return (
        <svg {...props}>
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
      );
    case 'navigation':
      return (
        <svg {...props}>
          <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
      );
    case 'shield-check':
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 11 12 14 22 4" />
        </svg>
      );
    case 'check-circle-2':
      return (
        <svg {...props}>
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'map-pin':
      return (
        <svg {...props}>
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg {...props}>
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
        </svg>
      );
    case 'x':
      return (
        <svg {...props}>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      );
    case 'info':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      );
    case 'external-link':
      return (
        <svg {...props}>
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      );
    case 'activity':
      return (
        <svg {...props}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case 'play':
      return (
        <svg {...props}>
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      );
    case 'pause':
      return (
        <svg {...props}>
          <rect x="6" y="4" width="4" height="16" />
          <rect x="14" y="4" width="4" height="16" />
        </svg>
      );
    case 'trash-2':
      return (
        <svg {...props}>
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      );
    case 'square':
      return (
        <svg {...props}>
          <rect x="5" y="5" width="14" height="14" rx="2" />
        </svg>
      );
    case 'book-open':
      return (
        <svg {...props}>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
    case 'sliders':
      return (
        <svg {...props}>
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
      );
    case 'zap':
      return (
        <svg {...props}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case 'edit-3':
      return (
        <svg {...props}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      );
    case 'alert-triangle':
      return (
        <svg {...props}>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      );
    case 'alert-circle':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    case 'check':
      return (
        <svg {...props}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case 'hard-drive':
      return (
        <svg {...props}>
          <line x1="22" y1="12" x2="2" y2="12" />
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
          <line x1="6" y1="16" x2="6.01" y2="16" />
          <line x1="10" y1="16" x2="10.01" y2="16" />
        </svg>
      );
    default:
      return null;
  }
}

// A compass sample older than this is treated as lost.
const COMPASS_STALE_MS = 2000;
// iOS reports compass accuracy in degrees; above this the azimuth reading is not trustworthy.
const COMPASS_ACCURACY_GOOD_DEG = 15;
// Pitch and roll range the phone must sweep through during calibration.
const CALIBRATION_TILT_SPAN_DEG = 90;

function App() {
  const [isInIframe, setIsInIframe] = useState(false);

  // GPS State
  const [location, setLocation] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('pending'); // 'pending' | 'requesting' | 'granted' | 'failed' | 'timeout'
  const [gpsAccuracyMode, setGpsAccuracyMode] = useState('precise'); // 'precise' | 'approximate'
  const [gpsErrorMsg, setGpsErrorMsg] = useState(null);
  const [gpsCountdown, setGpsCountdown] = useState(30);
  const [showManualEntryForm, setShowManualEntryForm] = useState(false);
  const gpsTimerRef = useRef(null);
  const gpsAttemptRef = useRef(0);

  // Orientation Sensor State
  const [sensorStatus, setSensorStatus] = useState('pending'); // 'pending' | 'requesting' | 'granted' | 'denied'
  const [sensorErrorMsg, setSensorErrorMsg] = useState(null);
  const [sensorActive, setSensorActive] = useState(false);
  const [orientation, setOrientation] = useState({ heading: null, pitch: 0, roll: 0, planeTilt: 0 });

  // Manual Gyro / Simulation Mode State (for testing & desktop)
  const [manualSensorMode, setManualSensorMode] = useState(false);
  const [simHeading, setSimHeading] = useState(15);
  const [simPitch, setSimPitch] = useState(35);

  // Smoothing refs (EMA)
  const smoothedHeadingRef = useRef(null);
  const smoothedPitchRef = useRef(null);
  const smoothedRollRef = useRef(null);
  const smoothedPlaneTiltRef = useRef(null);

  // Calibration wizard state
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibratedSuccessfully, setCalibratedSuccessfully] = useState(false);
  const [calibrationResult, setCalibrationResult] = useState(null); // null | 'good' | 'unverified' | 'poor' | 'incomplete'
  const calibrationRef = useRef(null);

  // Compass accuracy reported by the OS in degrees (iOS only); null when the platform does not report it.
  const [compassAccuracy, setCompassAccuracy] = useState(null);
  const compassAccuracyRef = useRef(null);

  // Manual Input modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualLatInput, setManualLatInput] = useState('');
  const [manualLonInput, setManualLonInput] = useState('');

  // Guide Modal
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Sensitivity Modal State & LocalStorage Persistence
  const [showSensitivityModal, setShowSensitivityModal] = useState(false);
  const [sensitivityMaxMss, setSensitivityMaxMss] = useState(() => {
    try {
      const saved = localStorage.getItem('polaralign_sensitivity_mss');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch (e) {}
    return 1.0; // Default 1.0 m/s² = 100%
  });

  // Opposite Pole when Parallel State & Persistence
  const [useOppositePoleWhenParallel, setUseOppositePoleWhenParallel] = useState(() => {
    try {
      const saved = localStorage.getItem('polaralign_opposite_pole_parallel');
      return saved === 'true';
    } catch (e) {}
    return false;
  });

  const handleToggleOppositePole = (e) => {
    const val = e.target.checked;
    setUseOppositePoleWhenParallel(val);
    try {
      localStorage.setItem('polaralign_opposite_pole_parallel', val ? 'true' : 'false');
    } catch (e) {}
  };

  const handleSetSensitivity = (val) => {
    const num = Math.max(0.05, Math.min(10.0, parseFloat(val) || 1.0));
    setSensitivityMaxMss(num);
    try {
      localStorage.setItem('polaralign_sensitivity_mss', num.toString());
    } catch (e) {}
  };

  // Mount Stability Monitor State
  const [stabilityHistory, setStabilityHistory] = useState([]);
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);
  const [currentAccValue, setCurrentAccValue] = useState(0);
  const [currentMss, setCurrentMss] = useState(0);

  // App version loaded dynamically from package.json
  const [appVersion, setAppVersion] = useState(() => {
    if (typeof __APP_VERSION__ !== 'undefined') {
      return __APP_VERSION__;
    }
    return '';
  });

  useEffect(() => {
    fetch('./package.json')
      .then(res => res.json())
      .then(pkg => {
        if (pkg && pkg.version) {
          setAppVersion(pkg.version);
        }
      })
      .catch(() => {});
  }, []);

  // Offline Cache & SW State
  const [cacheStatus, setCacheStatus] = useState('working'); // 'working' | 'ready' | 'clearing' | 'cleared'
  const [cacheMsg, setCacheMsg] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      setCacheStatus('working');
      navigator.serviceWorker.register('./sw.js').then(
        (reg) => {
          console.log('PWA ServiceWorker registered:', reg.scope);
          if (reg.active) {
            setCacheStatus('ready');
          } else {
            const sw = reg.installing || reg.waiting;
            if (sw) {
              sw.addEventListener('statechange', (e) => {
                if (e.target.state === 'activated') {
                  setCacheStatus('ready');
                }
              });
            }
            setTimeout(() => setCacheStatus('ready'), 800);
          }
        },
        (err) => {
          console.log('PWA ServiceWorker registration failed:', err);
          setCacheStatus('ready');
        }
      );
    } else {
      setCacheStatus('ready');
    }
  }, []);

  const clearOfflineCache = async () => {
    setCacheStatus('clearing');
    setCacheMsg('Clearing offline field cache...');
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let reg of registrations) {
          await reg.unregister();
        }
      }
      setCacheStatus('cleared');
      setCacheMsg('Cache cleared! Re-indexing field assets...');
      setTimeout(() => {
        if ('serviceWorker' in navigator) {
          setCacheStatus('working');
          navigator.serviceWorker.register('./sw.js').then(
            () => {
              setTimeout(() => {
                setCacheStatus('ready');
                setCacheMsg(null);
              }, 600);
            },
            () => {
              setCacheStatus('ready');
              setCacheMsg(null);
            }
          );
        } else {
          setCacheStatus('ready');
          setCacheMsg(null);
        }
      }, 1000);
    } catch (err) {
      console.error('Failed to clear cache:', err);
      setCacheStatus('ready');
      setCacheMsg(null);
    }
  };

  // Sync location state to manual inputs so modal displays active GPS coordinates
  useEffect(() => {
    if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
      setManualLatInput(location.latitude.toFixed(4));
      setManualLonInput(location.longitude.toFixed(4));
    }
  }, [location]);

  useEffect(() => {
    setIsInIframe(window.self !== window.top);
  }, []);

  const openStandaloneWindow = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  // Compass calibration (guided figure-8).
  // A web page cannot open the phone's own calibration screen. Both iOS and Android recalibrate the
  // magnetometer automatically while the phone is rotated through many orientations, so this wizard
  // tracks real motion coverage and, on iOS, the accuracy the OS reports (webkitCompassAccuracy).
  const CALIBRATION_TIMEOUT_MS = 60000;
  const startCalibration = () => {
    calibrationRef.current = {
      sectors: new Set(),
      betaMin: Infinity,
      betaMax: -Infinity,
      gammaMin: Infinity,
      gammaMax: -Infinity,
      startedAt: Date.now(),
    };
    setCalibrationProgress(0);
    setCalibrationResult(null);
    setIsCalibrating(true);
  };

  const finishCalibration = (completedMotion) => {
    calibrationRef.current = null;
    setIsCalibrating(false);
    const acc = compassAccuracyRef.current;
    let result;
    if (!completedMotion) {
      result = 'incomplete';
    } else if (acc === null) {
      result = 'unverified'; // Android and most browsers do not report compass accuracy
    } else if (acc >= 0 && acc <= COMPASS_ACCURACY_GOOD_DEG) {
      result = 'good';
    } else {
      result = 'poor';
    }
    setCalibrationResult(result);
    setCalibratedSuccessfully(result === 'good' || result === 'unverified');
  };

  useEffect(() => {
    if (!isCalibrating) return;
    const timer = setTimeout(() => finishCalibration(false), CALIBRATION_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isCalibrating]);

  // Sensor listener
  useEffect(() => {
    if (sensorStatus !== 'granted') return;

    let rafId = null;
    let latestAbsEvent = null;
    let latestRelEvent = null;
    let lastAbsTime = 0;
    let staleTimer = null;

    const processLatestEvent = () => {
      rafId = null;
      const now = performance.now();

      // Only a true compass source is accepted for heading. The relative 'deviceorientation' alpha
      // is NOT referenced to north on most Android browsers, so it is never used as a heading.
      let rawHeading = null;
      let accuracy = null;
      const absFresh = latestAbsEvent && now - lastAbsTime < COMPASS_STALE_MS;
      if (absFresh) {
        if (typeof latestAbsEvent.webkitCompassHeading === 'number' && !isNaN(latestAbsEvent.webkitCompassHeading)) {
          // iOS: degrees clockwise from magnetic north
          rawHeading = latestAbsEvent.webkitCompassHeading;
          if (typeof latestAbsEvent.webkitCompassAccuracy === 'number' && !isNaN(latestAbsEvent.webkitCompassAccuracy)) {
            accuracy = latestAbsEvent.webkitCompassAccuracy;
          }
        } else if (typeof latestAbsEvent.alpha === 'number' && !isNaN(latestAbsEvent.alpha)) {
          // Earth-referenced alpha: the device top edge points at (360 - alpha) for any pitch/roll.
          rawHeading = normalizeAngle(360 - latestAbsEvent.alpha);
        }
      }
      compassAccuracyRef.current = accuracy;

      // Pitch & Roll
      const activeEv = (absFresh && latestAbsEvent) || latestRelEvent || latestAbsEvent;
      let rawPitch = 0;
      let rawRoll = 0;
      if (activeEv) {
        if (typeof activeEv.beta === 'number' && !isNaN(activeEv.beta)) rawPitch = activeEv.beta;
        if (typeof activeEv.gamma === 'number' && !isNaN(activeEv.gamma)) rawRoll = activeEv.gamma;
      }

      // Screen orientation compensation (Portrait vs Landscape)
      const screenAngle = (screen.orientation && typeof screen.orientation.angle === 'number')
        ? screen.orientation.angle
        : (typeof window.orientation === 'number' ? window.orientation : 0);

      let effectivePitch = rawPitch;
      let effectiveRoll = rawRoll;
      if (screenAngle === 90) {
        effectivePitch = rawRoll;
        effectiveRoll = -rawPitch;
      } else if (screenAngle === -90 || screenAngle === 270) {
        effectivePitch = -rawRoll;
        effectiveRoll = rawPitch;
      } else if (screenAngle === 180) {
        effectivePitch = -rawPitch;
        effectiveRoll = -rawRoll;
      }

      // Calibration motion coverage
      const cal = calibrationRef.current;
      if (cal) {
        if (rawHeading !== null) cal.sectors.add(Math.floor(normalizeAngle(rawHeading) / 45) % 8);
        cal.betaMin = Math.min(cal.betaMin, rawPitch);
        cal.betaMax = Math.max(cal.betaMax, rawPitch);
        cal.gammaMin = Math.min(cal.gammaMin, rawRoll);
        cal.gammaMax = Math.max(cal.gammaMax, rawRoll);
        const headingPart = cal.sectors.size / 8;
        const pitchPart = Math.min(1, (cal.betaMax - cal.betaMin) / CALIBRATION_TILT_SPAN_DEG);
        const rollPart = Math.min(1, (cal.gammaMax - cal.gammaMin) / CALIBRATION_TILT_SPAN_DEG);
        const prog = Math.round((headingPart * 0.5 + pitchPart * 0.25 + rollPart * 0.25) * 100);
        setCalibrationProgress(prog);
        if (prog >= 100) finishCalibration(true);
      }

      // Adaptive EMA filtering
      if (rawHeading !== null) {
        smoothedHeadingRef.current = smoothAngle(smoothedHeadingRef.current, rawHeading);
      } else {
        smoothedHeadingRef.current = null;
      }
      const curP = smoothLinear(smoothedPitchRef.current, effectivePitch);
      smoothedPitchRef.current = curP;
      const curR = smoothLinear(smoothedRollRef.current, effectiveRoll);
      smoothedRollRef.current = curR;

      // 3D surface plane tilt from horizontal ground
      const radB = (rawPitch * Math.PI) / 180;
      const radG = (rawRoll * Math.PI) / 180;
      const cosGz = Math.abs(Math.cos(radB) * Math.cos(radG));
      const rawPlaneTilt = Math.acos(Math.min(1, Math.max(-1, cosGz))) * (180 / Math.PI);
      const curPT = smoothLinear(smoothedPlaneTiltRef.current, rawPlaneTilt);
      smoothedPlaneTiltRef.current = curPT;

      setSensorActive(true);
      setCompassAccuracy(accuracy);
      setOrientation({
        heading: smoothedHeadingRef.current,
        pitch: curP,
        roll: curR,
        planeTilt: curPT
      });
    };

    const schedule = () => {
      if (rafId === null) rafId = requestAnimationFrame(processLatestEvent);
    };

    const isAbsoluteEvent = (e) =>
      typeof e.webkitCompassHeading === 'number' || e.absolute === true || e.type === 'deviceorientationabsolute';

    const handleOrientation = (e) => {
      if (isAbsoluteEvent(e)) {
        latestAbsEvent = e;
        lastAbsTime = performance.now();
      } else {
        latestRelEvent = e;
      }
      schedule();
    };

    // If the compass stops reporting entirely, drop the heading instead of freezing the last value.
    staleTimer = setInterval(schedule, 1000);

    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      clearInterval(staleTimer);
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [sensorStatus]);

  // Cleanup GPS Timer on component unmount
  useEffect(() => {
    return () => {
      if (gpsTimerRef.current) {
        clearInterval(gpsTimerRef.current);
      }
    };
  }, []);

  const startGpsLock = (forceApproximate = false) => {
    if (gpsTimerRef.current) {
      clearInterval(gpsTimerRef.current);
      gpsTimerRef.current = null;
    }
    // Each attempt gets an id so a late callback from an earlier attempt cannot overwrite a newer one.
    const attemptId = ++gpsAttemptRef.current;
    const isCurrent = () => gpsAttemptRef.current === attemptId;
    const isApprox = forceApproximate;
    setGpsAccuracyMode(isApprox ? 'approximate' : 'precise');
    setGpsStatus('requesting');
    setGpsCountdown(30);
    setGpsErrorMsg(null);
    setLocation(null);

    const stopTimer = () => {
      if (gpsTimerRef.current) {
        clearInterval(gpsTimerRef.current);
        gpsTimerRef.current = null;
      }
    };

    const startTime = Date.now();
    gpsTimerRef.current = setInterval(() => {
      if (!isCurrent()) return;
      const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, 30 - elapsedSec);
      setGpsCountdown(remaining);
      if (remaining <= 0) {
        stopTimer();
        if (!isApprox) {
          // Precise mode timed out: try approximate (network) location for 30s
          startGpsLock(true);
        } else {
          gpsAttemptRef.current++;
          setGpsStatus('timeout');
          setGpsErrorMsg('GPS location timed out after trying Precise (30s) and Approximate (30s) modes. No coordinates received from device.');
          setShowManualEntryForm(true);
        }
      }
    }, 500);

    if ('geolocation' in navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!isCurrent()) return;
          stopTimer();
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          // Geolocation altitude is metres above the WGS84 ellipsoid, which is what the magnetic model expects.
          const altKm = typeof pos.coords.altitude === 'number' && isFinite(pos.coords.altitude) ? pos.coords.altitude / 1000 : 0;
          const dec = calculateMagneticDeclination(lat, lon, altKm, new Date());
          setLocation({
            latitude: lat,
            longitude: lon,
            altitudeKm: altKm,
            declination: dec,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
            source: isApprox ? 'approximate-gps' : 'gps'
          });
          setManualLatInput(lat.toFixed(4));
          setManualLonInput(lon.toFixed(4));
          setGpsStatus('granted');
          setGpsErrorMsg(null);
          setShowManualEntryForm(false);
        },
        (err) => {
          if (!isCurrent()) return;
          // Precise mode: position unavailable (2) or timeout (3) -> switch to Approximate mode
          if (!isApprox && (err.code === 2 || err.code === 3)) {
            stopTimer();
            startGpsLock(true);
            return;
          }
          stopTimer();
          gpsAttemptRef.current++;
          let msg = 'GPS location lock failed.';
          if (err.code === 1) {
            msg = 'Location permission was denied by device/browser settings.';
          } else if (err.code === 2) {
            msg = 'GPS satellite position unavailable on device.';
          } else if (err.code === 3) {
            msg = 'GPS satellite lock timed out.';
          }
          setGpsStatus('failed');
          setGpsErrorMsg(msg);
          setShowManualEntryForm(true);
        },
        { enableHighAccuracy: !isApprox, timeout: 30000, maximumAge: 0 }
      );
    } else {
      stopTimer();
      gpsAttemptRef.current++;
      setGpsStatus('failed');
      setGpsErrorMsg('Geolocation is not supported by this browser. Please enter coordinates manually.');
      setShowManualEntryForm(true);
    }
  };

  const cancelGpsLock = () => {
    gpsAttemptRef.current++;
    if (gpsTimerRef.current) {
      clearInterval(gpsTimerRef.current);
      gpsTimerRef.current = null;
    }
  };

  // Must be called from a user gesture (tap / form submit) so iOS shows its motion permission prompt.
  const requestSensors = async () => {
    setSensorStatus('requesting');
    setSensorErrorMsg(null);
    try {
      if (
        typeof window.DeviceOrientationEvent !== 'undefined' &&
        typeof window.DeviceOrientationEvent.requestPermission === 'function'
      ) {
        const res = await window.DeviceOrientationEvent.requestPermission();
        if (res === 'granted') {
          setSensorStatus('granted');
        } else {
          setSensorStatus('denied');
          setSensorErrorMsg('Motion sensors blocked on iOS. Please allow motion permissions in iOS Settings > Safari.');
        }
      } else if ('DeviceOrientationEvent' in window) {
        setSensorStatus('granted');
      } else {
        setSensorStatus('denied');
        setSensorErrorMsg('Orientation motion sensors are not available on this device.');
      }
    } catch (e) {
      setSensorStatus('denied');
      setSensorErrorMsg('Could not initialize motion sensors: ' + (e.message || 'Permission error'));
    }
  };

  const requestGpsAndSensors = async () => {
    startGpsLock();
    await requestSensors();
  };

  const handleApplyManualGps = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const lat = parseFloat(manualLatInput);
    const lon = parseFloat(manualLonInput);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setGpsErrorMsg('Invalid Latitude: enter a number between -90.0° (South) and +90.0° (North).');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setGpsErrorMsg('Invalid Longitude: enter a number between -180.0° (West) and +180.0° (East).');
      return;
    }
    cancelGpsLock();
    const dec = calculateMagneticDeclination(lat, lon, 0, new Date());
    setLocation({
      latitude: lat,
      longitude: lon,
      altitudeKm: 0,
      declination: dec,
      accuracy: null,
      timestamp: Date.now(),
      source: 'manual'
    });
    setGpsStatus('granted');
    setGpsErrorMsg(null);
    setShowManualModal(false);
    setShowManualEntryForm(false);
    // Entering coordinates manually must still enable the motion sensors.
    if (sensorStatus !== 'granted') {
      requestSensors();
    }
  };
  const isReady = Boolean(
    location && 
    typeof location.latitude === 'number' && 
    !isNaN(location.latitude) && 
    typeof location.longitude === 'number' && 
    !isNaN(location.longitude) && 
    sensorStatus === 'granted'
  );

  const currentLat = location ? location.latitude : 0;
  const decOffset = location ? location.declination : 0;

  const isSouthern = currentLat < 0;

  const sensorPitch = orientation.pitch !== null ? Math.abs(orientation.pitch) : 0;
  const sensorPlaneTilt = (orientation.planeTilt !== undefined && orientation.planeTilt !== null) ? orientation.planeTilt : sensorPitch;

  const isParallelMode = !manualSensorMode && (
    useOppositePoleWhenParallel || 
    sensorPitch > 90 || 
    (sensorPitch < 45 && orientation.roll !== null && Math.abs(orientation.roll) > 15)
  );

  const flipToOpposite = useOppositePoleWhenParallel;
  const effectiveSouthern = flipToOpposite ? !isSouthern : isSouthern;

  const targetPole = effectiveSouthern ? 'True South' : 'True North';
  const targetBearing = effectiveSouthern ? 180 : 0;

  // Heading comes only from a real compass (or the simulator). With no compass signal there is no
  // azimuth guidance at all, rather than a made-up value.
  const headingAvailable = manualSensorMode || orientation.heading !== null;
  const rawHeading = manualSensorMode ? simHeading : (orientation.heading !== null ? orientation.heading : 0);
  const compassAccuracyPoor = !manualSensorMode && compassAccuracy !== null && (compassAccuracy < 0 || compassAccuracy > COMPASS_ACCURACY_GOOD_DEG);
  const magneticModelExpired = isMagneticModelExpired();

  const magHeading = normalizeAngle(rawHeading);
  const trueHeading = normalizeAngle(magHeading + decOffset);

  const azDiff = getHeadingDifference(trueHeading, targetBearing);
  const absAzError = Math.abs(azDiff);
  const azLocked = headingAvailable && !compassAccuracyPoor && absAzError <= 1.5;

  const targetAlt = Math.abs(currentLat);
  const rawPitch = manualSensorMode
    ? simPitch
    : (sensorPitch > 90 ? Math.abs(180 - sensorPitch) : sensorPitch);

  let measuredAlt = rawPitch;
  if (!manualSensorMode && isParallelMode) {
    // Parallel Mounting (Normal Parallel & Viking Mode): Phone long axis is orthogonal (90°) to polar axis.
    // Raw pitch measures (90° - Latitude), so elevation is |90° - rawPitch|.
    measuredAlt = Math.abs(90 - rawPitch);
  }

  const altError = measuredAlt - targetAlt;
  const absAltError = Math.abs(altError);
  const altLocked = absAltError <= 1.0;

  // Device Motion listener for real hardware sensors
  useEffect(() => {
    if (!isMonitoringActive) return;

    let gravityEstimate = { x: 0, y: 0, z: 9.81 };
    let initializedGravity = false;
    let lastSampleTime = 0;

    const handleMotion = (event) => {
      if (document.visibilityState !== 'visible') return;

      // Continuous gravity estimation tracking for smooth high-pass filtering
      if (event.accelerationIncludingGravity && (event.accelerationIncludingGravity.x !== null || event.accelerationIncludingGravity.y !== null || event.accelerationIncludingGravity.z !== null)) {
        const rawX = event.accelerationIncludingGravity.x || 0;
        const rawY = event.accelerationIncludingGravity.y || 0;
        const rawZ = event.accelerationIncludingGravity.z || 0;

        if (!initializedGravity) {
          gravityEstimate = { x: rawX, y: rawY, z: rawZ };
          initializedGravity = true;
        } else {
          const alpha = 0.95;
          gravityEstimate.x = alpha * gravityEstimate.x + (1 - alpha) * rawX;
          gravityEstimate.y = alpha * gravityEstimate.y + (1 - alpha) * rawY;
          gravityEstimate.z = alpha * gravityEstimate.z + (1 - alpha) * rawZ;
        }
      }

      const now = Date.now();
      if (now - lastSampleTime < 200) return;
      lastSampleTime = now;

      let accMag = 0;

      if (event.acceleration && (event.acceleration.x !== null || event.acceleration.y !== null || event.acceleration.z !== null)) {
        const ax = event.acceleration.x || 0;
        const ay = event.acceleration.y || 0;
        const az = event.acceleration.z || 0;
        accMag = Math.sqrt(ax * ax + ay * ay + az * az);
      } else if (event.accelerationIncludingGravity) {
        const rawX = event.accelerationIncludingGravity.x || 0;
        const rawY = event.accelerationIncludingGravity.y || 0;
        const rawZ = event.accelerationIncludingGravity.z || 0;

        const linX = rawX - gravityEstimate.x;
        const linY = rawY - gravityEstimate.y;
        const linZ = rawZ - gravityEstimate.z;

        accMag = Math.sqrt(linX * linX + linY * linY + linZ * linZ);
      }

      // Subtract sensor baseline noise floor (1% of max strength) and scale 100% Strength to sensitivityMaxMss
      const floorMss = sensitivityMaxMss * 0.01;
      const usableRange = Math.max(0.001, sensitivityMaxMss - floorMss);
      const netAcc = Math.max(0, accMag - floorMss);
      const percentVal = Math.min(100, Math.max(0, (netAcc / usableRange) * 100));

      setCurrentMss(accMag);
      setCurrentAccValue(percentVal);

      setStabilityHistory((prev) => {
        const fiveMinAgo = now - 300000;
        const filtered = prev.filter((pt) => pt.time >= fiveMinAgo);
        return [...filtered.slice(-500), { time: now, value: percentVal, mss: accMag }];
      });
    };

    window.addEventListener('devicemotion', handleMotion, true);

    return () => {
      window.removeEventListener('devicemotion', handleMotion, true);
    };
  }, [isMonitoringActive, sensitivityMaxMss]);

  // Background ambient vibration simulation in manual sensor mode
  useEffect(() => {
    if (!isMonitoringActive || !manualSensorMode) return;

    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      const baseNoiseAcc = 0.002 + Math.random() * (0.015 * sensitivityMaxMss);
      const floorMss = sensitivityMaxMss * 0.01;
      const usableRange = Math.max(0.001, sensitivityMaxMss - floorMss);
      const netAcc = Math.max(0, baseNoiseAcc - floorMss);
      const percentVal = Math.min(100, Math.max(0, (netAcc / usableRange) * 100));

      setCurrentMss(baseNoiseAcc);
      setCurrentAccValue(percentVal);

      setStabilityHistory((prev) => {
        const fiveMinAgo = now - 300000;
        const filtered = prev.filter((pt) => pt.time >= fiveMinAgo);
        return [...filtered.slice(-500), { time: now, value: percentVal, mss: baseNoiseAcc }];
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isMonitoringActive, manualSensorMode, sensitivityMaxMss]);

  // Compute 5-minute rolling statistics & SVG chart points scaled dynamically to sensitivityMaxMss
  const nowTime = Date.now();
  const validHistory = stabilityHistory.filter((pt) => nowTime - pt.time <= 300000);

  let currentPeak = 0;
  let peakMss = 0;
  let avgAccValue = 0;
  let avgMss = 0;

  const activeFloorMss = sensitivityMaxMss * 0.01;
  const activeUsableRange = Math.max(0.001, sensitivityMaxMss - activeFloorMss);

  if (validHistory.length > 0) {
    let sumVal = 0;
    let sumMss = 0;
    validHistory.forEach((pt) => {
      const ptMss = pt.mss !== undefined ? pt.mss : (pt.value / 100) * sensitivityMaxMss;
      const net = Math.max(0, ptMss - activeFloorMss);
      const scaledVal = Math.min(100, Math.max(0, (net / activeUsableRange) * 100));

      if (scaledVal > currentPeak) currentPeak = scaledVal;
      if (ptMss > peakMss) peakMss = ptMss;
      sumVal += scaledVal;
      sumMss += ptMss;
    });
    avgAccValue = sumVal / validHistory.length;
    avgMss = sumMss / validHistory.length;
  }

  let svgPathPoints = '';
  let latestSvgX = null;
  let latestSvgY = null;

  if (validHistory.length > 0) {
    const points = validHistory.map((pt) => {
      const elapsedSec = Math.min(300, Math.max(0, (nowTime - pt.time) / 1000));
      const ptMss = pt.mss !== undefined ? pt.mss : (pt.value / 100) * sensitivityMaxMss;
      const net = Math.max(0, ptMss - activeFloorMss);
      const scaledVal = Math.min(100, Math.max(0, (net / activeUsableRange) * 100));

      const x = 290 - (elapsedSec / 300) * 258;
      const y = 155 - (scaledVal / 100) * 140;
      return { x, y };
    });

    points.sort((a, b) => a.x - b.x);

    svgPathPoints = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    latestSvgX = points.length > 0 ? points[points.length - 1].x : null;
    latestSvgY = points.length > 0 ? points[points.length - 1].y : null;
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto px-4 py-4 select-none bg-slate-950 text-slate-100">

      {/* EMBEDDED IFRAME NOTICE */}
      {isInIframe && (
        <div className="mb-3 p-3 bg-cyan-950/80 border border-cyan-500/50 rounded-2xl text-xs space-y-2">
          <div className="flex items-start gap-2 text-cyan-200">
            <Icon name="info" className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-cyan-100 font-bold">Preview Environment Detected</strong>
              <span>Browser security rules require HTTPS and may block Geolocation & Motion sensor prompts inside embedded frames. Open in a new tab if prompts do not appear.</span>
            </div>
          </div>
          <button
            onClick={openStandaloneWindow}
            className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow flex items-center justify-center gap-2 text-xs transition-all cursor-pointer"
          >
            <Icon name="external-link" className="w-4 h-4" />
            <span>Open Standalone Tab for Full Permissions</span>
          </button>
        </div>
      )}

      {/* HEADER */}
      <header className="flex items-center justify-between p-3 rounded-2xl border mb-3 bg-slate-900 border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Icon name="compass" className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">Simple Polar Align</h1>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {isReady && location && (
            <button
              onClick={() => setShowManualModal(true)}
              className="px-2 py-1.5 rounded-xl text-xs font-mono font-semibold bg-slate-800 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-all cursor-pointer flex items-center gap-1"
              title="View or edit coordinates"
            >
              <Icon name="map-pin" className="w-3.5 h-3.5 text-cyan-400" />
              <span>{location.latitude >= 0 ? '+' : ''}{location.latitude.toFixed(1)}°, {location.longitude >= 0 ? '+' : ''}{location.longitude.toFixed(1)}°</span>
            </button>
          )}

          <button
            onClick={() => setShowGuideModal(true)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 transition-all cursor-pointer flex items-center gap-1"
            title="User Guide & Documentation"
          >
            <Icon name="book-open" className="w-3.5 h-3.5" />
            <span>Guide</span>
          </button>

          {isReady && (
            <button
              onClick={() => setShowCalibrationModal(true)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1 transition-all cursor-pointer ${
                calibratedSuccessfully 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              }`}
              title="Calibrate Compass (Figure 8)"
            >
              <Icon name="rotate-cw" className="w-3.5 h-3.5" />
              <span>{calibratedSuccessfully ? 'Calibrated' : 'Calibrate'}</span>
            </button>
          )}
        </div>
      </header>

      {/* PERMISSION GATEWAY */}
      {!isReady ? (
        <div className="flex-1 flex flex-col justify-center items-center text-center p-5 sm:p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4 my-auto shadow-2xl">

          {/* Header Icon / Radar Animation */}
          {gpsStatus === 'requesting' ? (
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/40 animate-ping opacity-60"></div>
              <div className="absolute inset-2 rounded-full border border-cyan-400/60 animate-pulse bg-cyan-500/10"></div>
              <Icon name="navigation" className="w-8 h-8 text-cyan-400 relative z-10 animate-bounce" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
              <Icon name="navigation" className="w-8 h-8" />
            </div>
          )}

          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-white">GPS & Sensor Access</h2>
            <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
              Live GPS lock (or manual coordinates) and orientation sensors are strictly required to calculate True Celestial Pole and wedge elevation angle.
            </p>
          </div>

          {/* 1. ACQUIRING GPS LOCK (COUNTDOWN STATE) */}
          {gpsStatus === 'requesting' && (
            <div className="w-full bg-slate-950 p-4 rounded-2xl border border-cyan-500/40 space-y-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Icon name="rotate-cw" className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>
                    {gpsAccuracyMode === 'precise' ? 'Acquiring Precise Satellite GPS...' : 'Acquiring Device Approximate Location...'}
                  </span>
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {gpsCountdown}s remaining
                </span>
              </div>

              {/* Progress Countdown Bar */}
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.max(2, (gpsCountdown / 30) * 100)}%` }}
                ></div>
              </div>

              <p className="text-[11px] text-slate-400">
                {gpsAccuracyMode === 'precise'
                  ? 'Attempting high-precision GNSS satellite lock (30s). If satellite signal is unavailable, will switch to Approximate location.'
                  : 'Switching to approximate/network location (30s) to acquire observing coordinates.'}
              </p>

              <button
                type="button"
                onClick={() => {
                  cancelGpsLock();
                  setGpsStatus('failed');
                  setShowManualEntryForm(true);
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Icon name="edit-3" className="w-3.5 h-3.5 text-cyan-400" />
                <span>Skip & Enter Coordinates Manually</span>
              </button>
            </div>
          )}

          {/* 2. INITIAL PENDING STATE */}
          {gpsStatus === 'pending' && !showManualEntryForm && (
            <div className="w-full space-y-2.5">
              <button
                onClick={requestGpsAndSensors}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Icon name="shield-check" className="w-5 h-5" />
                <span>Acquire GPS & Sensor Access</span>
              </button>

              <button
                type="button"
                onClick={() => setShowManualEntryForm(true)}
                className="w-full py-2 text-xs font-medium text-cyan-400 hover:text-cyan-300 underline underline-offset-2 cursor-pointer transition-all"
              >
                Or Enter Observing Coordinates Manually
              </button>
            </div>
          )}

          {/* 3. FAILED / TIMEOUT / MANUAL INPUT STATE */}
          {(showManualEntryForm || gpsStatus === 'failed' || gpsStatus === 'timeout') && (
            <div className="w-full bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3.5 text-left">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <Icon name="map-pin" className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Manual Observing Coordinates</span>
                </div>
                <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                  {gpsStatus === 'timeout' ? 'GPS TIMED OUT' : 'MANUAL INPUT'}
                </span>
              </div>

              {gpsErrorMsg && (
                <div className="p-2 bg-amber-950/40 border border-amber-800/80 rounded-xl text-xs text-amber-300 flex items-start gap-1.5">
                  <Icon name="alert-triangle" className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>{gpsErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleApplyManualGps} className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Latitude (-90 to +90)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. -31.95 or 37.77"
                      value={manualLatInput}
                      onChange={(e) => setManualLatInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Longitude (-180 to +180)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 115.86 or -122.42"
                      value={manualLonInput}
                      onChange={(e) => setManualLonInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400">
                  Sign guide: North (+) / South (−), East (+) / West (−). Example for Perth: <strong className="text-slate-300">-31.95, 115.86</strong>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Icon name="check" className="w-4 h-4" />
                    <span>Apply & Proceed</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowManualEntryForm(false);
                      requestGpsAndSensors();
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Icon name="rotate-cw" className="w-3.5 h-3.5" />
                    <span>Try GPS Again</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SENSOR STATUS WARNING IF SENSORS DENIED */}
          {sensorErrorMsg && (
            <div className="w-full p-2.5 bg-rose-950/40 border border-rose-800 rounded-xl text-left text-xs text-rose-300 flex items-start gap-1.5">
              <Icon name="alert-circle" className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{sensorErrorMsg}</span>
            </div>
          )}

          {/* STATUS BAR FOOTER IN GATEWAY */}
          <div className="w-full grid grid-cols-3 gap-1.5 text-left text-xs pt-2 border-t border-slate-800">
            <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
              gpsStatus === 'granted' ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' :
              gpsStatus === 'requesting' ? 'bg-cyan-950/40 border-cyan-800 text-cyan-300 animate-pulse' :
              gpsStatus === 'timeout' || gpsStatus === 'failed' ? 'bg-amber-950/40 border-amber-800 text-amber-300' : 
              'bg-slate-950 border-slate-800 text-slate-400'
            }`}>
              <Icon name={gpsStatus === 'granted' ? 'check-circle-2' : gpsStatus === 'requesting' ? 'rotate-cw' : 'map-pin'} className={`w-3.5 h-3.5 shrink-0 ${gpsStatus === 'requesting' ? 'animate-spin' : ''}`} />
              <div className="min-w-0">
                <div className="font-bold text-[10px] leading-tight">GPS Status</div>
                <div className="text-[9px] opacity-80 leading-tight truncate">
                  {gpsStatus === 'granted' ? 'Locked ✓' :
                   gpsStatus === 'requesting' ? `${gpsAccuracyMode === 'precise' ? 'Precise' : 'Approx'} (${gpsCountdown}s)` :
                   gpsStatus === 'timeout' ? 'Timed Out' :
                   gpsStatus === 'failed' ? 'Unavailable' : 'Awaiting'}
                </div>
              </div>
            </div>

            <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
              sensorStatus === 'granted' ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' :
              sensorStatus === 'requesting' ? 'bg-cyan-950/40 border-cyan-800 text-cyan-300' :
              sensorStatus === 'denied' ? 'bg-rose-950/40 border-rose-800 text-rose-300' :
              'bg-slate-950 border-slate-800 text-slate-400'
            }`}>
              <Icon name={sensorStatus === 'granted' ? 'check-circle-2' : 'compass'} className="w-3.5 h-3.5 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-[10px] leading-tight">Sensors</div>
                <div className="text-[9px] opacity-80 leading-tight truncate">
                  {sensorStatus === 'granted' ? 'Active ✓' : 
                   sensorStatus === 'denied' ? 'Blocked ✕' : 
                   sensorStatus === 'requesting' ? 'Requesting...' : 'Awaiting'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={clearOfflineCache}
              disabled={cacheStatus === 'clearing'}
              title="Click to clear offline cache and re-index field assets"
              className={`p-2 rounded-xl border flex items-center gap-1.5 transition-all text-left cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${
                cacheStatus === 'clearing'
                  ? 'bg-amber-950/40 border-amber-800 text-amber-300'
                  : cacheStatus === 'cleared'
                  ? 'bg-cyan-950/40 border-cyan-800 text-cyan-300'
                  : cacheStatus === 'working'
                  ? 'bg-blue-950/40 border-blue-800 text-blue-300'
                  : 'bg-emerald-950/40 border-emerald-800 text-emerald-300 hover:border-emerald-600'
              }`}
            >
              <Icon
                name={
                  cacheStatus === 'clearing' || cacheStatus === 'working'
                    ? 'rotate-cw'
                    : cacheStatus === 'cleared'
                    ? 'check-circle-2'
                    : 'hard-drive'
                }
                className={`w-3.5 h-3.5 shrink-0 ${
                  cacheStatus === 'clearing' || cacheStatus === 'working'
                    ? 'animate-spin text-cyan-400'
                    : 'text-emerald-400 group-hover:text-cyan-300'
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-[10px] leading-tight flex items-center justify-between gap-1">
                  <span>Offline Cache</span>
                  <span className="text-[8px] font-mono text-cyan-400 opacity-70 group-hover:opacity-100">Clear ✕</span>
                </div>
                <div className="text-[9px] opacity-80 leading-tight truncate">
                  {cacheStatus === 'working'
                    ? 'Working...'
                    : cacheStatus === 'clearing'
                    ? 'Clearing...'
                    : cacheStatus === 'cleared'
                    ? 'Cleared ✓'
                    : 'Field Ready ✓'}
                </div>
              </div>
            </button>
          </div>

          {cacheMsg && (
            <div className="w-full p-2 bg-cyan-950/80 border border-cyan-800/80 rounded-xl text-center text-xs text-cyan-300 font-mono animate-pulse">
              {cacheMsg}
            </div>
          )}

        </div>
      ) : (
        /* ACTIVE INSTRUMENT DISPLAY */
        <div className="flex-1 flex flex-col space-y-3">

          {/* PARALLEL MODE OPTIONS CONTROL BAR */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-2 shadow-md">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-200 hover:text-white select-none">
              <input
                type="checkbox"
                checked={useOppositePoleWhenParallel}
                onChange={handleToggleOppositePole}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500/50 accent-cyan-400 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="font-bold text-slate-100 leading-tight">Use Opposite Pole When Parallel</span>
                <span className="text-[10px] text-slate-400 leading-tight">
                  Target {isSouthern ? 'True North' : 'True South'} when phone is parallel (pitched face-up &lt; 90°)
                </span>
              </div>
            </label>

            {isParallelMode && (
              <span className={`px-2 py-1 rounded-xl text-[10px] font-mono font-bold shrink-0 border flex items-center gap-1 ${
                useOppositePoleWhenParallel
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
              }`}>
                <Icon name="rotate-cw" className="w-3 h-3" />
                <span>{useOppositePoleWhenParallel ? 'Viking Mode' : 'Parallel'}</span>
              </span>
            )}
          </div>

          {/* 1. AZIMUTH CARD */}
          <div className={`p-4 rounded-3xl border text-center relative overflow-hidden transition-all shadow-xl ${
            azLocked
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            {azLocked && <div className="absolute inset-0 bg-emerald-500/5 animate-pulse pointer-events-none" />}

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider opacity-75">1. Azimuth Alignment</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${azLocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'}`}>
                {!headingAvailable ? 'NO COMPASS' : azLocked ? 'LOCKED ✓' : `${absAzError.toFixed(1)}° off`}
              </span>
            </div>

            {headingAvailable && compassAccuracyPoor && (
              <div className="mb-2 p-2 bg-amber-950/50 border border-amber-700/70 rounded-xl text-[11px] text-amber-200 text-left flex items-start gap-1.5">
                <Icon name="alert-triangle" className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  Compass accuracy is {compassAccuracy < 0 ? 'unknown' : `±${Math.round(compassAccuracy)}°`}, too coarse to lock azimuth.
                  Tap <strong>Calibrate</strong> and move away from metal, magnets and motors.
                </span>
              </div>
            )}

            {magneticModelExpired && (
              <div className="mb-2 p-2 bg-rose-950/50 border border-rose-800 rounded-xl text-[11px] text-rose-200 text-left flex items-start gap-1.5">
                <Icon name="alert-circle" className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>The built-in WMM2025 magnetic model expired on 1 January 2030. Declination may be less accurate until the app is updated.</span>
              </div>
            )}

            {!headingAvailable ? (
              <div className="py-4 text-sm text-amber-200 space-y-1.5">
                <div className="flex items-center justify-center gap-1.5 font-bold">
                  <Icon name="alert-triangle" className="w-5 h-5 text-amber-400" />
                  <span>No compass signal</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  This browser is not reporting a north-referenced compass heading, so azimuth guidance is unavailable.
                  Try Chrome or Safari on a phone with a magnetometer, make sure motion access is allowed, and keep the page in the foreground.
                </p>
              </div>
            ) : (
            <>
            <div className="py-2.5">
              <div className="text-xl sm:text-2xl font-black tracking-tight">
                {azLocked ? (
                  <span className="text-emerald-400 flex items-center justify-center gap-1.5 text-xl sm:text-2xl">
                    <Icon name="check-circle-2" className="w-6 h-6" /> Pointing at {targetPole}!
                  </span>
                ) : azDiff > 0 ? (
                  <span className="text-cyan-400">Rotate Base ➔ <strong className="text-white">{absAzError.toFixed(1)}° RIGHT</strong> (CW)</span>
                ) : (
                  <span className="text-cyan-400">Rotate Base ⬅ <strong className="text-white">{absAzError.toFixed(1)}° LEFT</strong> (CCW)</span>
                )}
              </div>
            </div>

            {/* Compass Ring */}
            <div className="relative w-40 h-40 mx-auto my-3 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-700 bg-slate-950/60 flex items-center justify-center shadow-inner">
                <div className="absolute top-1 text-[9px] font-mono text-cyan-400 font-bold">{effectiveSouthern ? '180° S' : '0° N'}</div>
                <div className="absolute bottom-1 text-[9px] font-mono text-slate-500">{effectiveSouthern ? '0° N' : '180° S'}</div>
                <div className="absolute left-1 text-[9px] font-mono text-slate-500">{effectiveSouthern ? 'E' : 'W'}</div>
                <div className="absolute right-1 text-[9px] font-mono text-slate-500">{effectiveSouthern ? 'W' : 'E'}</div>

                <div 
                  className="absolute inset-2 rounded-full will-change-transform flex items-center justify-center pointer-events-none"
                  style={{ transform: `rotate(${- (trueHeading - targetBearing)}deg)` }}
                >
                  <div className="absolute top-2 w-3 h-6 bg-red-500 rounded-t-full shadow-md"></div>
                </div>

                <div className="absolute z-10 w-10 h-14 rounded-lg border-2 border-cyan-400 bg-cyan-950/80 flex flex-col items-center justify-center shadow">
                  <div className="w-1 h-5 bg-cyan-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-slate-800/60">
              <span>Mag: {magHeading.toFixed(1)}°</span>
              <span className="text-cyan-400 font-bold">True Heading: {trueHeading.toFixed(1)}°</span>
              <span>Dec: {decOffset > 0 ? '+' : ''}{decOffset.toFixed(1)}°</span>
            </div>
            </>
            )}
          </div>

          {/* 2. ELEVATION CARD */}
          <div className={`p-4 rounded-3xl border text-center relative overflow-hidden transition-all shadow-xl ${
            altLocked 
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            {altLocked && <div className="absolute inset-0 bg-emerald-500/5 animate-pulse pointer-events-none" />}

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider opacity-75">2. Elevation (Latitude)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${altLocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'}`}>
                {altLocked ? 'LOCKED ✓' : `${absAltError.toFixed(1)}° off`}
              </span>
            </div>

            <div className="py-2.5">
              <div className="text-xl sm:text-2xl font-black tracking-tight">
                {altLocked ? (
                  <span className="text-emerald-400 flex items-center justify-center gap-1.5 text-xl sm:text-2xl">
                    <Icon name="check-circle-2" className="w-6 h-6" /> Altitude Matched to Target Latitude!
                  </span>
                ) : ((isParallelMode && useOppositePoleWhenParallel) ? (altError < 0) : (altError > 0)) ? (
                  <span className="text-cyan-400">Lower Wedge Tilt by <strong className="text-white">{absAltError.toFixed(1)}°</strong> ⬇</span>
                ) : (
                  <span className="text-cyan-400">Raise Wedge Tilt by <strong className="text-white">{absAltError.toFixed(1)}°</strong> ⬆</span>
                )}
              </div>
            </div>

            <div className="my-2">
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">Sensor Tilt: <strong className="text-cyan-400">{measuredAlt.toFixed(1)}°</strong>{isParallelMode && <span className="text-[10px] text-indigo-400 font-sans ml-1">({useOppositePoleWhenParallel ? 'Viking Mode' : 'Parallel'})</span>}</span>
                <span className="text-slate-400">Target Lat: <strong className="text-emerald-400">{targetAlt.toFixed(1)}°</strong></span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full p-0.5 border border-slate-800">
                <div 
                  className={`h-full rounded-full transition-colors duration-300 ${altLocked ? 'bg-emerald-500' : 'bg-gradient-to-r from-cyan-500 to-indigo-500'}`}
                  style={{ width: `${Math.min(100, (measuredAlt / 90) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* 3. MOUNT STABILITY MONITOR CARD */}
          <div className="p-4 rounded-3xl border bg-slate-900 border-slate-800 text-slate-100 relative overflow-hidden transition-all shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Icon name="activity" className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-75 block">3. Mount Stability Monitor</span>
                  <span className="text-[10px] text-slate-400">Rolling 5-Min Vibration Analysis</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  !isMonitoringActive
                    ? 'bg-slate-800 text-slate-400'
                    : currentPeak >= 80
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : currentPeak >= 40
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {!isMonitoringActive
                    ? 'PAUSED'
                    : currentPeak >= 80
                    ? 'UNSTABLE ⚠'
                    : currentPeak >= 40
                    ? 'MINOR MOVEMENT ⚡'
                    : 'STABLE ✓'}
                </span>

                <button
                  onClick={() => setIsMonitoringActive(!isMonitoringActive)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
                    isMonitoringActive
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  }`}
                  title={isMonitoringActive ? 'Stop Stability Sampling' : 'Start Stability Sampling'}
                >
                  <Icon name={isMonitoringActive ? 'square' : 'play'} className="w-3.5 h-3.5" />
                  <span>{isMonitoringActive ? 'Stop' : 'Start'}</span>
                </button>
              </div>
            </div>

            {/* Metrics Pill Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80">
              <div className="space-y-0.5">
                <div className="text-[10px] text-slate-400 uppercase font-sans">Current</div>
                <div className={`font-bold ${currentAccValue >= 80 ? 'text-red-400' : currentAccValue >= 40 ? 'text-amber-400' : 'text-cyan-400'}`}>
                  {currentAccValue.toFixed(1)}%
                </div>
                <div className="text-[9px] text-slate-500">{currentMss.toFixed(3)} m/s²</div>
              </div>
              <div className="space-y-0.5 border-x border-slate-800/60">
                <div className="text-[10px] text-slate-400 uppercase font-sans">5-Min Peak</div>
                <div className={`font-bold ${currentPeak >= 80 ? 'text-red-400' : currentPeak >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {currentPeak.toFixed(1)}%
                </div>
                <div className="text-[9px] text-slate-500">{peakMss.toFixed(3)} m/s²</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] text-slate-400 uppercase font-sans">5-Min Avg</div>
                <div className="font-bold text-slate-200">
                  {avgAccValue.toFixed(1)}%
                </div>
                <div className="text-[9px] text-slate-500">{avgMss.toFixed(3)} m/s²</div>
              </div>
            </div>

            {/* Rolling 5-Minute Waterfall Chart (SVG) */}
            <div className="relative bg-slate-950 rounded-2xl border border-slate-800 p-2">
              <svg className="w-full h-44 overflow-visible" viewBox="0 0 300 180" preserveAspectRatio="none">
                {/* Horizontal Background Intensity Zones */}
                <rect x="32" y="99" width="258" height="56" fill="#10b981" fillOpacity="0.03" />
                <rect x="32" y="43" width="258" height="56" fill="#f59e0b" fillOpacity="0.06" />
                <rect x="32" y="15" width="258" height="28" fill="#ef4444" fillOpacity="0.08" />

                {/* Threshold Horizontal Grid Lines (40% and 80%) */}
                <line x1="32" y1="99" x2="290" y2="99" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                <line x1="32" y1="43" x2="290" y2="43" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

                {/* Y-Axis Value Labels (Left) */}
                <text x="28" y="18" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="end">100%</text>
                <text x="28" y="46" fill="#ef4444" fontSize="8" fontFamily="monospace" textAnchor="end">80%</text>
                <text x="28" y="102" fill="#f59e0b" fontSize="8" fontFamily="monospace" textAnchor="end">40%</text>
                <text x="28" y="158" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="end">0%</text>

                {/* Vertical Time Grid Lines (-5m to NOW) */}
                {[
                  { label: '-5m', x: 32 },
                  { label: '-4m', x: 83.6 },
                  { label: '-3m', x: 135.2 },
                  { label: '-2m', x: 186.8 },
                  { label: '-1m', x: 238.4 },
                  { label: 'NOW', x: 290 }
                ].map((item) => (
                  <g key={item.label}>
                    <line x1={item.x} y1="15" x2={item.x} y2="155" stroke="#1e293b" strokeWidth="1" opacity="0.6" />
                    <text x={item.x} y="170" fill={item.label === 'NOW' ? '#06b6d4' : '#64748b'} fontSize="8" fontFamily="monospace" textAnchor={item.label === '-5m' ? 'start' : item.label === 'NOW' ? 'end' : 'middle'}>
                      {item.label}
                    </text>
                  </g>
                ))}

                {/* Rolling Plot Line */}
                {svgPathPoints && (
                  <path
                    d={svgPathPoints}
                    fill="none"
                    stroke={currentPeak >= 80 ? '#ef4444' : currentPeak >= 40 ? '#f59e0b' : '#06b6d4'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Active Pulse Marker at Latest Time */}
                {latestSvgX !== null && latestSvgY !== null && (
                  <g>
                    <circle cx={latestSvgX} cy={latestSvgY} r="4" fill={currentAccValue >= 80 ? '#ef4444' : currentAccValue >= 40 ? '#f59e0b' : '#06b6d4'} className="animate-ping" opacity="0.7" />
                    <circle cx={latestSvgX} cy={latestSvgY} r="3" fill={currentAccValue >= 80 ? '#ef4444' : currentAccValue >= 40 ? '#f59e0b' : '#06b6d4'} />
                  </g>
                )}
              </svg>
            </div>

            {/* Actions & Sample Count */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setStabilityHistory([])}
                  className="px-2.5 py-1 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-mono text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                  title="Clear rolling graph history"
                >
                  <Icon name="trash-2" className="w-3 h-3" />
                  <span>Clear History</span>
                </button>

                <button
                  onClick={() => setShowSensitivityModal(true)}
                  className="px-2.5 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                  title="Adjust 100% Vibration Sensitivity Threshold"
                >
                  <Icon name="sliders" className="w-3 h-3" />
                  <span>Sensitivity ({sensitivityMaxMss.toFixed(2)} m/s²)</span>
                </button>
              </div>

              <span className="text-[10px] text-slate-500 font-mono">
                {validHistory.length} samples
              </span>
            </div>
          </div>

        </div>
      )}

      {/* CALIBRATION MODAL */}
      {showCalibrationModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 text-center shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Icon name="sparkles" className="w-4 h-4 text-cyan-400" /> Compass Calibration
              </h3>
              <button onClick={() => { setShowCalibrationModal(false); if (isCalibrating) finishCalibration(false); }} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="w-24 h-24 mx-auto rounded-full bg-cyan-500/10 border-2 border-cyan-500/40 flex items-center justify-center relative overflow-hidden">
                <div className="text-3xl font-black text-cyan-400 animate-pulse">∞</div>
                {isCalibrating && (
                  <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center text-sm font-mono font-bold text-cyan-200">
                    {calibrationProgress}%
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">Figure-8 Motion Calibration</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Your phone recalibrates its compass by itself while it is rotated through many directions.
                  Hold it away from metal and electronics, then slowly wave it in a <strong>figure-8 (∞)</strong>, tilting and turning it as you go.
                  The bar fills only as the phone actually covers every direction.
                </p>
              </div>

              <div className="text-[11px] font-mono text-slate-400">
                OS compass accuracy:{' '}
                {compassAccuracy === null
                  ? 'not reported by this device'
                  : compassAccuracy < 0
                    ? <span className="text-rose-300">unreliable — needs calibration</span>
                    : <span className={compassAccuracy <= COMPASS_ACCURACY_GOOD_DEG ? 'text-emerald-300' : 'text-amber-300'}>±{Math.round(compassAccuracy)}°</span>}
              </div>

              {isCalibrating ? (
                <div className="space-y-2">
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-150"
                      style={{ width: `${calibrationProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-cyan-400 animate-pulse font-medium">Keep turning and tilting in a figure-8…</p>
                  <button
                    onClick={() => finishCalibration(false)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs cursor-pointer"
                  >
                    Stop
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <button
                    onClick={startCalibration}
                    disabled={orientation.heading === null}
                    className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Icon name="rotate-cw" className="w-4 h-4" />
                    <span>{calibrationResult ? 'Calibrate Again' : 'Start Figure-8 Calibration'}</span>
                  </button>
                  {orientation.heading === null && (
                    <p className="text-[11px] text-amber-300">No compass signal from this device, so there is nothing to calibrate.</p>
                  )}

                  {calibrationResult === 'good' && (
                    <div className="p-2.5 bg-emerald-950/50 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center justify-center gap-1.5">
                      <Icon name="check-circle-2" className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Calibrated: the phone reports ±{Math.round(compassAccuracy)}° compass accuracy.</span>
                    </div>
                  )}
                  {calibrationResult === 'unverified' && (
                    <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/70 rounded-xl text-xs text-emerald-200 flex items-start gap-1.5 text-left">
                      <Icon name="check-circle-2" className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Motion complete. This device does not report compass accuracy, so check the heading against a known landmark if you can.</span>
                    </div>
                  )}
                  {calibrationResult === 'poor' && (
                    <div className="p-2.5 bg-amber-950/50 border border-amber-800 rounded-xl text-xs text-amber-200 flex items-start gap-1.5 text-left">
                      <Icon name="alert-triangle" className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>Accuracy is still {compassAccuracy !== null && compassAccuracy >= 0 ? `±${Math.round(compassAccuracy)}°` : 'unreliable'}. Move further from metal, the mount and any motors, then try again.</span>
                    </div>
                  )}
                  {calibrationResult === 'incomplete' && (
                    <div className="p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300">
                      Calibration stopped before the phone covered every direction.
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => { setShowCalibrationModal(false); if (isCalibrating) finishCalibration(false); }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MANUAL LOCATION MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Icon name="map-pin" className="w-4 h-4 text-cyan-400" /> Enter Manual Coordinates
              </h3>
              <button onClick={() => setShowManualModal(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyManualGps} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Latitude (-90 to 90)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={manualLatInput}
                  onChange={(e) => setManualLatInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Longitude (-180 to 180)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={manualLonInput}
                  onChange={(e) => setManualLonInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow transition-all cursor-pointer"
              >
                Apply Location & Calculate Declination
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SENSITIVITY MODAL */}
      {showSensitivityModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Icon name="sliders" className="w-4 h-4 text-cyan-400" /> Vibration Sensitivity Scale
              </h3>
              <button onClick={() => setShowSensitivityModal(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Set the acceleration threshold that represents <strong className="text-cyan-300">100% Max Vibration Strength</strong>. All monitor indicators scale automatically as a percentage of this value.
              </p>

              {/* Preset Buttons */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-mono uppercase">Preset Sensitivity Levels</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '0.20 m/s²', name: 'Ultra-Sensitive', val: 0.2 },
                    { label: '0.50 m/s²', name: 'High Sensitivity', val: 0.5 },
                    { label: '1.00 m/s²', name: 'Standard (Default)', val: 1.0 },
                    { label: '2.00 m/s²', name: 'Coarse / Windy', val: 2.0 }
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      onClick={() => handleSetSensitivity(preset.val)}
                      className={`p-2 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                        Math.abs(sensitivityMaxMss - preset.val) < 0.01
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-mono">{preset.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{preset.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Range Slider */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Custom 100% Limit:</span>
                  <span className="text-cyan-300 font-bold">{sensitivityMaxMss.toFixed(2)} m/s²</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="3.00"
                  step="0.05"
                  value={sensitivityMaxMss}
                  onChange={(e) => handleSetSensitivity(e.target.value)}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Calculated Scaled Threshold Breakdown */}
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 text-[11px] space-y-2">
                <div className="font-mono uppercase text-[10px] text-slate-400 border-b border-slate-800 pb-1">
                  Scaled Threshold Breakdown
                </div>
                <div className="grid grid-cols-3 gap-1 text-center font-mono">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Floor (1%)</div>
                    <div className="text-slate-200 font-bold">{(sensitivityMaxMss * 0.01).toFixed(3)}</div>
                    <div className="text-[9px] text-slate-500">m/s²</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <div className="text-amber-400 text-[10px]">Amber (40%)</div>
                    <div className="text-amber-300 font-bold">{(sensitivityMaxMss * 0.40).toFixed(3)}</div>
                    <div className="text-[9px] text-slate-500">m/s²</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="text-red-400 text-[10px]">Red (80%)</div>
                    <div className="text-red-300 font-bold">{(sensitivityMaxMss * 0.80).toFixed(3)}</div>
                    <div className="text-[9px] text-slate-500">m/s²</div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSensitivityModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
            >
              Save & Done
            </button>
          </div>
        </div>
      )}

      {/* IN-APP USER GUIDE MODAL */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden">

            {/* Guide Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Icon name="book-open" className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white leading-tight">User Guide & Reference</h3>
                  <p className="text-[10px] text-slate-400">Simple Polar Align Field Guide</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shadow"
              >
                <span>Return to App</span>
                <Icon name="x" className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable Guide Content */}
            <div className="p-5 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed">

              {/* Introduction Section */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                <h4 className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
                  <Icon name="compass" className="w-3.5 h-3.5 text-indigo-400" />
                  How Sensor-Based Alignment Works
                </h4>
                <p className="text-[11px] text-slate-300">
                  This app aligns your tracker mount using your phone's internal sensors. It reads your GPS position, calculates the local <strong className="text-cyan-300">Magnetic Declination</strong> (the difference between magnetic north and true celestial north/south), and uses your phone's compass and pitch sensors to guide alignment in two physical axes.
                </p>
              </div>

              {/* Use Modes Section */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1">
                  Use Modes
                </h4>

                {/* Mode 1 */}
                <div className="space-y-1 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <div className="font-bold text-cyan-300 flex items-center justify-between text-xs">
                    <span>1. Normal Mode — Perpendicular</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">Perpendicular</span>
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-0.5 pl-2 pt-1 font-sans">
                    <li><strong className="text-slate-400">Facing:</strong> Hemisphere Pole</li>
                    <li><strong className="text-slate-400">Phone Mount Setup:</strong> phone held 90 degrees to the tracker</li>
                    <li><strong className="text-slate-400">Phone Position:</strong> Screen facing up with the top pointing at the pole.</li>
                  </ul>
                </div>

                {/* Mode 2 */}
                <div className="space-y-1 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <div className="font-bold text-indigo-300 flex items-center justify-between text-xs">
                    <span>2. Normal Mode — Parallel</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">Parallel</span>
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-0.5 pl-2 pt-1 font-sans">
                    <li><strong className="text-slate-400">Facing:</strong> Hemisphere Pole</li>
                    <li><strong className="text-slate-400">Phone Mount Setup:</strong> phone held next to or behind the tracker</li>
                    <li><strong className="text-slate-400">Phone Position:</strong> Screen facing DOWN with the back middle pointing at the pole.</li>
                  </ul>
                </div>

                {/* Mode 3 */}
                <div className="space-y-1 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <div className="font-bold text-amber-300 flex items-center justify-between text-xs">
                    <span>3. Viking Mode — Parallel</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">Viking Mode</span>
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-0.5 pl-2 pt-1 font-sans">
                    <li><strong className="text-slate-400">Facing:</strong> Opposite Direction of your Pole</li>
                    <li><strong className="text-slate-400">Phone Mount Setup:</strong> phone held next to or behind the tracker</li>
                    <li><strong className="text-slate-400">Phone Position:</strong> Screen facing UP with the back middle pointing at the opposite pole.</li>
                  </ul>
                </div>
              </div>

              {/* Step-by-Step Alignment Process */}
              <div className="space-y-4">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1">
                  How to Align Your Tracker Mount
                </h4>

                {/* Step 1 */}
                <div className="space-y-1 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-mono">1</span>
                    <span>Position Phone via Phone Mount</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-5">
                    Do not lay your phone directly against the metal mount, as magnetic metal parts interfere with compass sensors. Use a phone mount or bracket that holds the phone slightly away while keeping it aligned parallel or perpendicular to the mount's axis.
                  </p>
                  <p className="text-[11px] text-slate-300 pl-5 pt-1 border-t border-slate-800/80">
                    <strong className="text-amber-300">Parallel & Opposite Pole Option:</strong> When mounting the phone parallel to the tracker (pitched face-up &lt; 90°), if you need to align toward the opposite celestial pole (e.g., aligning to True North while in the Southern Hemisphere), check <strong className="text-cyan-300">"Use Opposite Pole When Parallel"</strong> in the options header.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="space-y-1 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-mono">2</span>
                    <span>Adjust Altitude Axis (Tilt Up / Down)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-5">
                    Tilt your mount wedge vertically. Follow the on-screen Altitude guidance arrows until the pitch angle matches your local latitude target.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="space-y-1 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-mono">3</span>
                    <span>Adjust Azimuth Axis (Rotate Left / Right)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-5">
                    Rotate your mount wedge horizontally. The app uses the compass and calculated declination offset to point your mount wedge directly toward True Celestial North (or South).
                  </p>
                </div>

                {/* Step 4 */}
                <div className="space-y-1 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-mono">4</span>
                    <span>Mount Stability Monitor</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-5">
                    Monitors micro-vibrations in real time using your accelerometer. Review the 5-minute rolling graph to detect wind gusts, ground settling, or mount wedge movement.
                  </p>
                </div>
              </div>

              {/* PWA & Offline Use */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Icon name="sparkles" className="w-3.5 h-3.5 text-cyan-400" />
                  PWA & Dark-Sky Field Offline Use
                </h4>
                <p className="text-[11px] text-slate-300">
                  Save Simple Polar Align to your phone's home screen for field use without cell coverage:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="block text-cyan-400 mb-0.5">Desktop Chrome / Edge</strong>
                    <span>Click <span className="text-cyan-300">⊕ Install</span> in address bar OR <span className="text-cyan-300">⋮</span> → "Save and Share" → "Install"</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="block text-cyan-400 mb-0.5">Android (Chrome)</strong>
                    <span>Tap Menu <span className="text-cyan-300">⋮</span> → "Install App" or "Add to Home screen"</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="block text-cyan-400 mb-0.5">iPhone / iPad (Safari)</strong>
                    <span>Tap Share <span className="text-cyan-300">⎋</span> → "Add to Home Screen"</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                  <p className="text-[10px] text-emerald-400 font-mono">
                    ✓ 100% Offline field ready — Service Worker caches core scripts on first load.
                  </p>
                  <button
                    onClick={clearOfflineCache}
                    disabled={cacheStatus === 'clearing'}
                    className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-cyan-300 hover:text-cyan-200 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-all shrink-0"
                  >
                    <Icon name="trash-2" className="w-3 h-3 text-cyan-400" />
                    <span>{cacheStatus === 'clearing' ? 'Clearing...' : 'Clear Cache'}</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-3 text-center text-[11px] text-slate-500 space-y-1">
        <div>Simple Polar Align • Real-Time GPS & Orientation Sensors</div>
        <div>
          {appVersion ? `ver. ${appVersion} ` : ''}©️ by{' '}
          <a
            href="https://www.mrrat.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline font-medium transition-colors"
          >
            MrRat.com
          </a>
        </div>
      </footer>

    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
