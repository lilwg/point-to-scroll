// Suppress noisy MediaPipe WASM warnings
const _warn = console.warn;
const _error = console.error;
const suppress = /landmark_projection|gl_context|NORM_RECT/;
console.warn = (...args) => { if (!suppress.test(args[0])) _warn(...args); };
console.error = (...args) => { if (!suppress.test(args[0])) _error(...args); };

let handLandmarker = null;
let canvas, ctx, video;
let running = false;

async function init() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  video = document.getElementById('camera');

  try {
    const { FilesetResolver, HandLandmarker } = await import('./vision_bundle.mjs');
    const vision = await FilesetResolver.forVisionTasks('./wasm');

    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: './hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 1,
    });

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 480, height: 480 },
    });
    video.srcObject = stream;
    await new Promise((r) => { video.onloadedmetadata = r; });
    await video.play();

    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;

    running = true;
    post({ type: 'ready' });
    captureLoop();
  } catch (err) {
    post({ type: 'error', message: err.message });
    console.error('Detector init failed:', err);
  }
}

function captureLoop() {
  if (!running) return;

  if (video.readyState >= 2) {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const size = Math.min(vw, vh);
    const sx = (vw - size) / 2;
    const sy = (vh - size) / 2;

    createImageBitmap(video, sx, sy, size, size).then((bitmap) => {
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();

      const results = handLandmarker.detectForVideo(canvas, performance.now());

      if (results.landmarks?.length > 0) {
        const gesture = detectPointing(results.landmarks[0]);
        post({ type: 'gesture', gesture: gesture || 'idle' });
      } else {
        post({ type: 'gesture', gesture: null });
      }
    }).catch(() => {});
  }

  setTimeout(captureLoop, 100);
}

function detectPointing(lm) {
  const wrist = lm[0];
  const indexTip = lm[8];

  const indexDist = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y);
  const middleDist = Math.hypot(lm[12].x - wrist.x, lm[12].y - wrist.y);
  const ringDist = Math.hypot(lm[16].x - wrist.x, lm[16].y - wrist.y);
  const pinkyDist = Math.hypot(lm[20].x - wrist.x, lm[20].y - wrist.y);

  const avgOther = (middleDist + ringDist + pinkyDist) / 3;
  if (indexDist < avgOther * 1.4) return null;

  if (indexTip.y < wrist.y - 0.04) return 'point_up';
  if (indexTip.y > wrist.y + 0.04) return 'point_down';
  return null;
}

function post(data) {
  window.parent.postMessage(data, '*');
}

window.addEventListener('message', (event) => {
  if (event.data?.type === 'stop') {
    running = false;
    if (video?.srcObject) {
      video.srcObject.getTracks().forEach((t) => t.stop());
    }
  }
});

init();
