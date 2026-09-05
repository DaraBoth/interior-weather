/**
 * Face detection that actually works.
 *
 * Three tiers, tried in order, so the chamber degrades instead of breaking:
 *
 *   1. window.FaceDetector — the Shape Detection API. Free and instant where it
 *      exists, but it is not a real standard: Safari and Firefox never shipped it
 *      and desktop Chrome usually lacks it. Treated as a lucky bonus, not a plan.
 *   2. MediaPipe BlazeFace — a genuine model, works in every modern browser.
 *      Costs one ~2MB download of WASM + weights, cached by the browser after that.
 *   3. Manual — everyone taps their own face. Needs no network and no permission
 *      beyond the camera itself.
 *
 * Everything runs in the page. No frame is ever uploaded anywhere.
 */

export type FaceBox = { x: number; y: number; w: number; h: number };
export type Tier = "native" | "mediapipe" | "none";

type Detector = {
  tier: Tier;
  detect: (video: HTMLVideoElement) => Promise<FaceBox[]>;
  close?: () => void;
};

const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

let cached: Detector | null = null;
let loading: Promise<Detector> | null = null;

/** Native Shape Detection API, if this browser happens to have it. */
function tryNative(): Detector | null {
  if (typeof window === "undefined") return null;
  const FD = (window as unknown as Record<string, any>).FaceDetector;
  if (!FD) return null;
  try {
    const d = new FD({ fastMode: true, maxDetectedFaces: 12 });
    return {
      tier: "native",
      async detect(video) {
        const vw = video.videoWidth || 1;
        const vh = video.videoHeight || 1;
        const faces = await d.detect(video);
        return faces.map((f: any) => ({
          x: (f.boundingBox.x / vw) * 100,
          y: (f.boundingBox.y / vh) * 100,
          w: (f.boundingBox.width / vw) * 100,
          h: (f.boundingBox.height / vh) * 100,
        }));
      },
    };
  } catch {
    return null;
  }
}

/** The real one. Downloads a model the first time, then it is cached. */
async function loadMediaPipe(): Promise<Detector> {
  const { FilesetResolver, FaceDetector } = await import("@mediapipe/tasks-vision");
  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
  const detector = await FaceDetector.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
    runningMode: "VIDEO",
    minDetectionConfidence: 0.5,
  });

  return {
    tier: "mediapipe",
    async detect(video) {
      const vw = video.videoWidth || 1;
      const vh = video.videoHeight || 1;
      const res = detector.detectForVideo(video, performance.now());
      return (res.detections || [])
        .map((d) => d.boundingBox)
        .filter((b): b is NonNullable<typeof b> => Boolean(b))
        .map((b) => ({
          x: (b.originX / vw) * 100,
          y: (b.originY / vh) * 100,
          w: (b.width / vw) * 100,
          h: (b.height / vh) * 100,
        }));
    },
    close() {
      try { detector.close(); } catch { /* already gone */ }
    },
  };
}

/**
 * Returns the best detector this browser can manage.
 * Never throws: on total failure it reports tier "none" and the caller
 * should fall back to manual markers.
 */
export function getDetector(): Promise<Detector> {
  if (cached) return Promise.resolve(cached);
  if (loading) return loading;

  loading = (async () => {
    const native = tryNative();
    if (native) {
      cached = native;
      return native;
    }
    try {
      const mp = await loadMediaPipe();
      cached = mp;
      return mp;
    } catch {
      const none: Detector = { tier: "none", detect: async () => [] };
      cached = none;
      return none;
    }
  })();

  return loading;
}

export function describeTier(t: Tier): string {
  if (t === "native") return "AUTOMATIC (BUILT-IN)";
  if (t === "mediapipe") return "AUTOMATIC (MODEL LOADED)";
  return "MANUAL ONLY — DETECTION UNAVAILABLE";
}
