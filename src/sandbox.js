// Suppress noisy MediaPipe WASM warnings
const _warn = console.warn;
const _error = console.error;
const suppress = /landmark_projection|gl_context|NORM_RECT/;
console.warn = (...args) => { if (!suppress.test(args[0])) _warn(...args); };
console.error = (...args) => { if (!suppress.test(args[0])) _error(...args); };

let handLandmarker = null;
let canvas, ctx;

async function init() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  try {
    post({ type: 'status', message: 'Loading hand detection model...' });

    const { FilesetResolver, HandLandmarker } = await import('./vision_bundle.mjs');
    const vision = await FilesetResolver.forVisionTasks('./wasm');

    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 1,
    });

    post({ type: 'ready' });
  } catch (err) {
    post({ type: 'error', message: err.message });
    console.error('Sandbox init failed:', err);
  }
}

window.addEventListener('message', (event) => {
  if (!event.data?.type) return;

  switch (event.data.type) {
    case 'init':
      canvas.width = event.data.width;
      canvas.height = event.data.height;
      break;
    case 'frame':
      processFrame(event.data.bitmap, event.data.timestamp);
      break;
  }
});

function processFrame(bitmap, timestamp) {
  if (!handLandmarker) return;

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const results = handLandmarker.detectForVideo(canvas, timestamp);

  if (results.landmarks?.length > 0) {
    const lm = results.landmarks[0];

    const pointing = detectPointing(lm);
    const landmarks = lm.map((p) => ({ x: p.x, y: p.y }));
    post({ type: 'result', gesture: pointing || 'idle', landmarks });
  } else {
    post({ type: 'result', gesture: null, landmarks: null });
  }
}

function detectPointing(lm) {
  const wrist = lm[0];
  const indexTip = lm[8];
  const middleTip = lm[12];

  const indexDist = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y);
  const middleDist = Math.hypot(middleTip.x - wrist.x, middleTip.y - wrist.y);
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

init();
