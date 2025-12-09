from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from ultralytics import YOLO
import json
from datetime import datetime
from collections import deque
import asyncio
import os

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLO model
model = YOLO('./Models/fire_model.pt')

# Directory for clips
CLIPS_DIR = "detection_clips"
os.makedirs(CLIPS_DIR, exist_ok=True)


# ----------------------------------------------------------
# VIDEO RECORDER (FIXED VERSION)
# ----------------------------------------------------------
class VideoRecorder:
    def __init__(self, buffer_duration=2.0, fps=10):
        self.buffer_duration = buffer_duration
        self.fps = fps

        self.frame_buffer = deque(maxlen=int(buffer_duration * fps))   # 2 seconds pre
        self.is_recording = False
        self.recording_buffer = []
        self.last_detection_ts = None

        self.current_filename = None
        self.frame_size = None

    # -------------------------------
    # Add every frame from client
    # -------------------------------
    def add_frame(self, frame, has_detection=False):
        # Set fixed size on first frame
        if self.frame_size is None:
            self.frame_size = (frame.shape[1], frame.shape[0])

        # Resize to correct dimensions
        if (frame.shape[1], frame.shape[0]) != self.frame_size:
            frame = cv2.resize(frame, self.frame_size)

        # Always add to circular pre-buffer
        self.frame_buffer.append(frame.copy())

        now = datetime.now().timestamp()

        # Update last detection time
        if has_detection:
            self.last_detection_ts = now

        # If recording → add frame
        if self.is_recording:
            self.recording_buffer.append(frame.copy())

            # Stop only if NO detection for 2 seconds
            if self.last_detection_ts is not None and (now - self.last_detection_ts) >= 2:
                print("No detection for 2 seconds → stopping clip")
                self.stop_recording()

    # -------------------------------
    # Start recording
    # -------------------------------
    def start_recording(self, class_name):
        if self.is_recording:
            return

        self.is_recording = True
        self.last_detection_ts = datetime.now().timestamp()

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.current_filename = f"{CLIPS_DIR}/detection_{class_name}_{timestamp}.mp4"

        # Add pre-detection frames (2 seconds)
        self.recording_buffer = list(self.frame_buffer)

        print(f"🔴 Started recording: {self.current_filename} ({len(self.recording_buffer)} pre-frames)")

    # -------------------------------
    # Stop & Save the clip
    # -------------------------------
    def stop_recording(self):
        if not self.is_recording or len(self.recording_buffer) == 0:
            return

        self.is_recording = False

        height, width = self.recording_buffer[0].shape[:2]

        # Force safe codec (Windows-compatible)
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        filename = self.current_filename

        writer = cv2.VideoWriter(filename, fourcc, self.fps, (width, height))

        if not writer.isOpened():
            print("❌ VIDEOIO error — could not write file")
            return

        for frame in self.recording_buffer:
            writer.write(frame)

        writer.release()

        print(f"✅ Clip saved: {filename} ({len(self.recording_buffer)} frames)")

        self.recording_buffer = []
        self.current_filename = None


# ----------------------------------------------------------
# WEBSOCKET ENDPOINT
# ----------------------------------------------------------
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected!")

    recorder = VideoRecorder(buffer_duration=2.0, fps=10)  # ✔ Your front sends 10 FPS

    try:
        while True:
            # Receive bytes
            data = await websocket.receive_bytes()

            # Decode JPEG → frame
            np_arr = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if frame is None:
                print("Frame decode failed")
                continue

            # YOLO detection
            results = model(frame, verbose=False)

            detections = []
            detection_occurred = False

            for result in results:
                for box in result.boxes:
                    class_id = int(box.cls[0])
                    class_name = model.names[class_id]
                    conf = float(box.conf[0])

                    # Get box coords
                    x1, y1, x2, y2 = map(int, box.xyxy[0])

                    detections.append({
                        "class": class_name,
                        "confidence": round(conf, 2),
                        "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                        "timestamp": datetime.now().strftime("%H:%M:%S")
                    })

                    detection_occurred = True

            # Add frame to recorder
            recorder.add_frame(frame, has_detection=detection_occurred)

            # Start recording
            if detection_occurred and not recorder.is_recording:
                recorder.start_recording(detections[0]["class"])

            # Send response to frontend
            await websocket.send_text(json.dumps({
                "type": "detection" if detection_occurred else "frame",
                "detections": detections
            }))

    except WebSocketDisconnect:
        print("Client disconnected")
        if recorder.is_recording:
            recorder.stop_recording()

    except Exception as e:
        print("Error:", e)
        import traceback
        traceback.print_exc()


# ----------------------------------------------------------
# Run server
# ----------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
