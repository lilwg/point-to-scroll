if (!window._p2sActive) {
  window._p2sActive = true;

  let autoScrollInterval = null;
  let currentGesture = null;
  let gestureStartTime = 0;
  let scrollSpeed = 6;
  const HOLD_MS = 400;

  // Emoji overlay in top-right corner
  const overlay = document.createElement('div');
  overlay.style.cssText = [
    'position:fixed', 'top:16px', 'right:16px', 'z-index:2147483647',
    'font-size:32px', 'line-height:1', 'padding:8px 12px',
    'background:rgba(0,0,0,0.6)', 'border-radius:12px',
    'pointer-events:none', 'transition:opacity 0.2s', 'opacity:0',
  ].join(';');
  document.documentElement.appendChild(overlay);

  // Hidden detector iframe (camera + hand detection)
  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('detector.html');
  iframe.allow = 'camera';
  iframe.style.cssText = 'width:1px;height:1px;border:0;position:fixed;top:-10px;left:-10px;opacity:0;pointer-events:none;';
  document.documentElement.appendChild(iframe);

  // Speed from storage
  chrome.storage.local.get({ speed: 6 }, (data) => {
    scrollSpeed = data.speed;
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.speed) {
      scrollSpeed = changes.speed.newValue;
      if (autoScrollInterval) {
        const down = currentGesture === 'point_down';
        startAutoScroll(down ? scrollSpeed : -scrollSpeed);
      }
    }
  });

  // Gesture results from detector iframe
  window.addEventListener('message', (event) => {
    if (event.source !== iframe.contentWindow) return;
    const msg = event.data;

    if (msg.type === 'gesture') {
      processGesture(msg.gesture);
    } else if (msg.type === 'ready') {
      showOverlay('\u{1F44B}', 1500);
    } else if (msg.type === 'error') {
      showOverlay('\u{274C}', 3000);
    }
  });

  function processGesture(gesture) {
    if (gesture === null) {
      stopAutoScroll();
      currentGesture = null;
      hideOverlay();
      return;
    }

    if (gesture === 'point_down' || gesture === 'point_up') {
      const down = gesture === 'point_down';

      if (currentGesture !== gesture) {
        stopAutoScroll();
        currentGesture = gesture;
        gestureStartTime = Date.now();
        overlay.textContent = down ? '\u{1F447}' : '\u{1F446}';
        overlay.style.opacity = '0.7';
        return;
      }

      if (!autoScrollInterval && Date.now() - gestureStartTime >= HOLD_MS) {
        startAutoScroll(down ? scrollSpeed : -scrollSpeed);
        overlay.textContent = down ? '\u{1F447}' : '\u{1F446}';
        overlay.style.opacity = '1';
      }
      return;
    }

    if (gesture === 'idle') {
      currentGesture = 'idle';
      if (!autoScrollInterval) hideOverlay();
      return;
    }
  }

  function startAutoScroll(speed) {
    if (autoScrollInterval) clearInterval(autoScrollInterval);
    autoScrollInterval = setInterval(() => window.scrollBy(0, speed), 16);
  }

  function stopAutoScroll() {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
  }

  function showOverlay(text, duration) {
    overlay.textContent = text;
    overlay.style.opacity = '1';
    if (duration) setTimeout(hideOverlay, duration);
  }

  function hideOverlay() {
    overlay.style.opacity = '0';
  }

  // Messages from popup / background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'p2s-speed') {
      scrollSpeed = msg.speed;
      if (autoScrollInterval) {
        const down = currentGesture === 'point_down';
        startAutoScroll(down ? scrollSpeed : -scrollSpeed);
      }
    } else if (msg.type === 'p2s-stop') {
      iframe.contentWindow?.postMessage({ type: 'stop' }, '*');
      stopAutoScroll();
      hideOverlay();
      setTimeout(() => {
        iframe.remove();
        overlay.remove();
        window._p2sActive = false;
      }, 100);
    }
  });
}
