# Wave

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
4. Click the Wave icon in your toolbar to open the gesture panel

## Gestures

| Gesture | Action |
|---------|--------|
| Open Palm | Scroll down |
| Point Up / Thumbs Up | Scroll up |
| Peace Sign | Toggle auto-scroll |
| Fist | Stop auto-scroll |

Hold a gesture for ~0.5 seconds to trigger. Keep holding to repeat (scroll gestures).

## How it works

Wave uses your webcam and [MediaPipe Hand Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker) to detect hand gestures in real time. The side panel shows a live camera preview with hand tracking overlay. All processing runs locally in your browser — no data is sent anywhere.

## Tips

- Position your hand 1-2 feet from the camera
- Use good lighting for best detection
- Auto-scroll is great for following long recipes hands-free
- Click Pause in the side panel to temporarily disable detection

## Requirements

- Chrome 116+
- Webcam
- Node.js (for building)
