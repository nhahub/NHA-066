import cv2
from datetime import datetime
from collections import deque

import os
import asyncio
from DBconnect.DBconnection import add_realtime_clips_async

class VideoRecorder:

    def __init__(self, buffer_duration, fps, userId, videoName):
        self.buffer_duration = buffer_duration
        self.fps = fps

        self.userId = userId
        self.videoName = videoName

        self.frame_buffer = deque(maxlen=int(buffer_duration * fps))
        self.is_recording = False
        self.recording_buffer = []
        self.last_detection_ts = None

        self.current_filename = None
        self.frame_size = None
        self.clip_start_time = None

    def add_frame(self, frame, has_detection=False):
        if self.frame_size is None:
            self.frame_size = (frame.shape[1], frame.shape[0])

        if (frame.shape[1], frame.shape[0]) != self.frame_size:
            frame = cv2.resize(frame, self.frame_size)

        self.frame_buffer.append(frame.copy())

        now = datetime.now().timestamp()

        if has_detection:
            self.last_detection_ts = now

        if self.is_recording:
            self.recording_buffer.append(frame.copy())

            if self.last_detection_ts is not None and (now - self.last_detection_ts) >= 2:
                print("No detection for 2 seconds → stopping clip")
                self.stop_recording()

    def start_recording(self, class_name):
        CLIPS_DIR = f"videos/clips/realTime/{self.userId}/{self.videoName}"
        os.makedirs(CLIPS_DIR, exist_ok=True)

        if self.is_recording:
            return

        self.is_recording = True
        self.last_detection_ts = datetime.now().timestamp()

        # ---- STORE CLIP START TIME ----
        self.clip_start_time = datetime.now()

        timestamp = self.clip_start_time.strftime("%Y%m%d_%H%M%S")

        self.current_filename = f"{CLIPS_DIR}/detection_{class_name}_{timestamp}.mp4"

        self.recording_buffer = list(self.frame_buffer)

        print(f"🔴 Started recording: {self.current_filename}")


    def stop_recording(self):
        if not self.is_recording or len(self.recording_buffer) == 0:
            return

        self.is_recording = False

        clip_end_time = datetime.now()
        clip_name = f"{self.clip_start_time.strftime('%H:%M:%S')} - {clip_end_time.strftime('%H:%M:%S')}"

        height, width = self.recording_buffer[0].shape[:2]
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")

        writer = cv2.VideoWriter(self.current_filename, fourcc, self.fps, (width, height))
        for frame in self.recording_buffer:
            writer.write(frame)
        writer.release()

        clip_path = self.current_filename

        print(f"✅ Clip saved: {clip_path}")

        asyncio.create_task(
            add_realtime_clips_async(self.userId, self.videoName, clip_name, clip_path)
        )

        self.recording_buffer = []
        self.current_filename = None
        self.clip_start_time = None


