# Point to Scroll

Scroll through recipes with hand gestures — no touching your computer with messy cooking hands.

## Setup

```bash
npm install
npm run build
```

Then load in Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** and select the `dist/` folder

## Usage

1. Navigate to any page you want to scroll hands-free
2. Click the Point to Scroll icon in your toolbar — detection starts automatically (grant camera access if prompted, one-time)
3. Point up or down to scroll the page

| Gesture | Action |
|---------|--------|
| Point up | Scroll up |
| Point down | Scroll down |

Hold a gesture for ~0.5 seconds to trigger continuous scrolling. A small emoji (👆/👇) appears in the top-right corner of the page to show the active gesture.

Use the **speed slider** in the popup to adjust scroll speed, or click **Stop** to turn off detection.

## How it works

Point to Scroll uses your webcam and [MediaPipe Hand Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker) to detect hand gestures in real time. All processing runs locally in your browser — no data is sent anywhere.

The extension activates per-tab and only requests the `activeTab`, `scripting`, and `storage` permissions — no broad host access needed.

## Tips

- Position your hand 1-2 feet from the camera
- Use good lighting for best detection
- Great for following long recipes, documentation, or articles hands-free

## Requirements

- Chrome 116+
- Webcam
- Node.js (for building)
