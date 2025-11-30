import os
import cv2
import subprocess
from pathlib import Path

def cut_anomalies(video_path: str, yolo_model, clips_dir: str = "clips",
                   pre_sec: float = 2.0, post_sec: float = 2.0, min_gap_sec: float = 2.0):
    video_name = Path(video_path).stem
    video_clips_dir = Path(clips_dir) / video_name
    video_clips_dir.mkdir(parents=True, exist_ok=True)
    
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    anomaly_frames = []
    print(f"[INFO] Processing {total_frames} frames at {fps} FPS for {video_name}")

    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        results = yolo_model(frame)
        if len(results[0].boxes) > 0:  # anomaly detected
            anomaly_frames.append(frame_idx)

        frame_idx += 1

    cap.release()

    if not anomaly_frames:
        print(f"[INFO] No anomalies detected in {video_name}.")
        return []

    # Convert seconds to frames
    pre_frames = int(pre_sec * fps)
    post_frames = int(post_sec * fps)
    min_gap_frames = int(min_gap_sec * fps)

    clip_sequences = []
    start_idx = anomaly_frames[0]
    end_idx = anomaly_frames[0]

    for f in anomaly_frames[1:]:
        if f - end_idx <= min_gap_frames:
            end_idx = f
        else:
            # End of current continuous block
            clip_sequences.append((start_idx, end_idx))
            start_idx = f
            end_idx = f
    clip_sequences.append((start_idx, end_idx))  # last block

    # Apply pre/post frames and clamp to video bounds
    clip_sequences = [
        (max(0, s - pre_frames), min(total_frames - 1, e + post_frames))
        for s, e in clip_sequences
    ]

    # Remove overlapping sequences
    final_clips = []
    for s, e in clip_sequences:
        if not final_clips:
            final_clips.append([s, e])
        else:
            prev_s, prev_e = final_clips[-1]
            if s <= prev_e:  # overlap, merge
                final_clips[-1][1] = max(prev_e, e)
            else:
                final_clips.append([s, e])

    # Cut clips using FFmpeg
    clip_paths = []
    for s, e in final_clips:
        start_time = round(s / fps, 3)
        end_time = round(e / fps, 3)
        clip_filename = f"{start_time:.2f}_{end_time:.2f}.mp4"
        clip_path = video_clips_dir / clip_filename

        cmd = [
            "ffmpeg",
            "-i", str(video_path),
            "-ss", str(start_time),
            "-to", str(end_time),
            "-c:v", "libx264",
            "-c:a", "aac",
            "-y",
            str(clip_path)
        ]
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        clip_paths.append(str(clip_path))

    print(f"[INFO] {len(clip_paths)} anomaly clips saved to {video_clips_dir}")
    return clip_paths
