const btn = document.getElementById('allow-btn');
const status = document.getElementById('status');

btn.addEventListener('click', async () => {
  btn.disabled = true;
  status.textContent = 'Requesting camera...';
  status.className = '';

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((t) => t.stop());
    status.textContent = 'Camera access granted! Close this tab and click Start Camera in the side panel.';
    status.className = 'success';
    btn.hidden = true;
  } catch (err) {
    btn.disabled = false;
    if (err.name === 'NotAllowedError') {
      status.textContent = 'Permission denied. Click Allow when Chrome asks, then try again.';
    } else {
      status.textContent = 'Error: ' + err.message;
    }
    status.className = 'error';
  }
});
