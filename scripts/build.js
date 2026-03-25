const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const DIST = path.join(__dirname, '..', 'dist');
const MP_DIR = path.join(__dirname, '..', 'node_modules', '@mediapipe', 'tasks-vision');

// Clean and create dist
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

// Copy src files
for (const file of fs.readdirSync(SRC)) {
  const srcPath = path.join(SRC, file);
  if (fs.statSync(srcPath).isFile()) {
    fs.copyFileSync(srcPath, path.join(DIST, file));
  }
}

// Copy MediaPipe vision bundle
for (const name of ['vision_bundle.mjs', 'vision_bundle.js']) {
  const bundlePath = path.join(MP_DIR, name);
  if (fs.existsSync(bundlePath)) {
    fs.copyFileSync(bundlePath, path.join(DIST, 'vision_bundle.mjs'));
    console.log(`Copied ${name}`);
    break;
  }
}

if (!fs.existsSync(path.join(DIST, 'vision_bundle.mjs'))) {
  console.error('Could not find MediaPipe vision bundle. Run: npm install');
  process.exit(1);
}

// Copy WASM files
const wasmSrc = path.join(MP_DIR, 'wasm');
if (fs.existsSync(wasmSrc)) {
  const wasmDest = path.join(DIST, 'wasm');
  fs.mkdirSync(wasmDest, { recursive: true });
  for (const file of fs.readdirSync(wasmSrc)) {
    fs.copyFileSync(path.join(wasmSrc, file), path.join(wasmDest, file));
  }
  console.log('Copied WASM files');
}

console.log('\nBuild complete!');
console.log('Load dist/ as an unpacked extension:');
console.log('  1. Go to chrome://extensions');
console.log('  2. Enable Developer Mode');
console.log('  3. Click "Load unpacked" and select the dist/ folder');
