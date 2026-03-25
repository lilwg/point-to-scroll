if (window._pointToScrollLoaded) throw '';
window._pointToScrollLoaded = true;

let autoScrollInterval = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== 'scroll') return;

  switch (message.action) {
    case 'down':
      window.scrollBy({ top: message.amount || 400, behavior: 'smooth' });
      break;
    case 'up':
      window.scrollBy({ top: -(message.amount || 400), behavior: 'smooth' });
      break;
    case 'auto-start':
      startAutoScroll(message.speed || 2);
      break;
    case 'grab':
      window.scrollBy(0, message.amount);
      break;
    case 'auto-stop':
      stopAutoScroll();
      break;
  }
});

function startAutoScroll(speed) {
  stopAutoScroll();
  autoScrollInterval = setInterval(() => {
    window.scrollBy(0, speed);
  }, 16);
}

function stopAutoScroll() {
  if (autoScrollInterval) {
    clearInterval(autoScrollInterval);
    autoScrollInterval = null;
  }
}
