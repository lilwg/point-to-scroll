// --- State ---
let isRunning = false;
let sandboxBusy = false;

let autoScrollActive = false;
let currentGesture = null;
let gestureStartTime = 0;
const HOLD_MS = 400;

const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];

// --- DOM refs ---
const video = document.getElementById('camera');
const statusEl = document.getElementById('status');
const gestureIcon = document.getElementById('gesture-icon');
const gestureLabel = document.getElementById('gesture-label');
const toggleBtn = document.getElementById('toggle-btn');
const startBtn = document.getElementById('start-btn');
const sandbox = document.getElementById('sandbox');

// --- Sandbox communication ---
window.addEventListener('message', (event) => {
  if (event.source !== sandbox.contentWindow) return;

  const msg = event.data;
  switch (msg.type) {
    case 'status':
      statusEl.textContent = msg.message;
      break;
    case 'ready':
      startCamera_auto();
      break;
    case 'error':
      statusEl.textContent = 'Error: ' + msg.message;
      break;
    case 'result':
      sandboxBusy = false;
      processGesture(msg);
      break;
  }
});

// --- Camera ---
async function startCamera_auto() {
  startBtn.hidden = true;
  statusEl.textContent = 'Starting camera...';

  try {
    await startCamera();

    sandbox.contentWindow.postMessage({
      type: 'init',
      width: video.videoWidth,
      height: video.videoHeight,
    }, '*');

    isRunning = true;
    toggleBtn.hidden = false;
    statusEl.textContent = 'Ready!';
    gestureIcon.textContent = '\u{270B}';
    gestureLabel.textContent = 'Point to scroll';

    captureLoop();
  } catch (err) {
    const name = err.name || 'Unknown';
    const msg = err.message || String(err);
    console.error('Camera failed:', name, msg, err);
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      // Permission not yet granted — show button as fallback
      statusEl.textContent = 'Camera access needed';
      gestureLabel.textContent = 'Click Start Camera';
      startBtn.hidden = false;
    } else if (name === 'NotFoundError') {
      statusEl.textContent = 'No camera found';
    } else if (name === 'NotReadableError') {
      statusEl.textContent = 'Camera in use by another app';
    } else {
      statusEl.textContent = 'Camera error (' + name + '): ' + msg;
    }
  }
}

startBtn.addEventListener('click', async () => {
  // Manual fallback — open permission page then retry
  chrome.tabs.create({ url: chrome.runtime.getURL('camera-permission.html') });
  gestureLabel.textContent = 'Grant access in the new tab, then reopen side panel';
});

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 480, height: 480 },
  });
  video.srcObject = stream;
  await new Promise((resolve) => {
    video.onloadedmetadata = resolve;
  });
  await video.play();
}

// --- Frame capture loop ---
function captureLoop() {
  if (!isRunning) return;

  if (video.readyState >= 2 && !sandboxBusy) {
    sandboxBusy = true;
    createImageBitmap(video).then((bitmap) => {
      sandbox.contentWindow.postMessage(
        { type: 'frame', bitmap, timestamp: performance.now() },
        '*',
        [bitmap]
      );
    }).catch(() => {
      sandboxBusy = false;
    });
  }

  setTimeout(captureLoop, 100);
}

// --- Gesture handling ---
function processGesture(msg) {
  const gesture = msg.gesture;

  if (gesture === null) {
    stopAutoScroll();
    currentGesture = null;
    gestureIcon.textContent = '\u{1F440}';
    gestureLabel.textContent = 'No hand detected';
    gestureLabel.style.color = '#888';
    return;
  }

  if (gesture === 'point_down' || gesture === 'point_up') {
    const down = gesture === 'point_down';

    if (currentGesture !== gesture) {
      stopAutoScroll();
      currentGesture = gesture;
      gestureStartTime = Date.now();
      gestureIcon.textContent = down ? '\u{1F447}' : '\u{1F446}';
      gestureLabel.textContent = 'Hold to scroll';
      gestureLabel.style.color = '#bbb';
      return;
    }

    if (!autoScrollActive && Date.now() - gestureStartTime >= HOLD_MS) {
      autoScrollActive = true;
      chrome.runtime.sendMessage({
        type: 'scroll', action: 'auto-start', speed: down ? 6 : -6,
      });
      gestureIcon.textContent = down ? '\u{1F447}' : '\u{1F446}';
      gestureLabel.textContent = 'Scrolling ' + (down ? 'down' : 'up');
      gestureLabel.style.color = '#2ec4b6';
    }
    return;
  }

  if (gesture === 'idle') {
    currentGesture = 'idle';
    if (!autoScrollActive) {
      gestureIcon.textContent = '\u{270B}';
      gestureLabel.textContent = 'Ready';
      gestureLabel.style.color = '#888';
    }
    return;
  }
}

function stopAutoScroll() {
  if (autoScrollActive) {
    autoScrollActive = false;
    chrome.runtime.sendMessage({ type: 'scroll', action: 'auto-stop' });
  }
}

// --- Toggle button ---
toggleBtn.addEventListener('click', () => {
  isRunning = !isRunning;
  if (isRunning) {
    toggleBtn.textContent = 'Pause';
    toggleBtn.classList.remove('paused');
    captureLoop();
  } else {
    toggleBtn.textContent = 'Resume';
    toggleBtn.classList.add('paused');
  }
});
