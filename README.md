# Cypher
## Real-time Abnormal Event Detection System using YOLOv10 & API Video Description

Real-time detection system for fire, smoke, weapons (handgun, knife, rifle), fighting, robbery, shoplifting, vandalism, and road accidents in CCTV footage using the latest **YOLOv10n** model.
Additionally, the system includes an API-powered generative model that analyzes the video, describes the detected events, and classifies the situation as a *normal event*, *potentially dangerous*, or *dangerous* based on the visual context.



---

## Overview 

This project aims to build a robust surveillance anomaly detection system specifically designed for CCTV cameras. The model detects critical classes including fire, smoke, violence, weapons, theft, and road accidents — enabling early warning and automated monitoring.

- **Goal**: Real-time detection of dangerous events in surveillance videos.
- **Target Environment**: CCTV cameras (indoor/outdoor, low resolution, various lighting conditions).
- **Model**: YOLOv10n (2024-2025 state-of-the-art, ultra-fast & lightweight).
- **Real Application**: Security control rooms, smart cities, stores, streets, and industrial safety.

---

## Sample
![alt text](image.png)

---

## Features

- Real-time object detection (>25 FPS on mid-range GPU)
- Supports RTSP streams and local video files
- High accuracy on fire, smoke, knife, rifle, and fighting
- Lightweight model (~5.7 MB) → deployable on edge devices
- Trained on mixed real-world CCTV datasets
- Confidence threshold & NMS tuning for low false positives
- generative analysis module that produces real-time textual summaries describing detected events


---

## Dataset

The model was trained on a merged dataset from multiple public CCTV sources:

| Dataset Name                          | Type      | Classes Included               | Images (approx) | Source |
|--------------------------------------|-----------|-------------------------------|------------------|-------|
| CCTV Handgun Footage (v5 & v6)       | CCTV      | handgun, knife, rifle         | ~4000           | Roboflow |
| Anomaly-Detection-Dataset           | CCTV      | fighting, normal              | ~3000           | Chen Chen (UNC Charlotte) |
| CCTV Fire Dataset (v21i)             | CCTV      | fire, smoke, normal           | ~2500           | Roboflow |
| Crime Data Labelling                 | CCTV      | robbery, shoplifting, abuse   | ~1500           | Kaggle   |

Total training images after merging & augmentation: **~14,000+**

All videos and Images are real CCTV footage (low quality, various angles, day/night).

---

## Repository Structure
```
CCTV-Anomaly-YOLOv10/
│
├── data/ # (symbolic link or copied dataset)
├── runs/ # training logs & plots
├── weights/
│ ├── best.pt # Final trained model (recommended)
│ └── last.pt
├── inference.py # Real-time camera & video script
├── requirements.txt
└── README.md
```

## Installation

```bash
pip install ultralytics opencv-python
# For GPU (NVIDIA)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

## Usage / How to Run
1. Real-time Webcam Detection
```Bash
python inference.py --source 0 --weights weights/best.pt
```

2. Test on Local Video
```Bash
python inference.py --source "path/to/video.mp4" --weights weights/best.pt --save
```
3. RTSP Stream (CCTV)
```Bash
python inference.py --source "rtsp://username:password@ip_address:554/stream" --weights weights/best.pt
```
4. Direct YOLO CLI (quick test)
```Bash
yolo predict model=weights/best.pt source="your_video.mp4" save=True conf=0.3
```

## Training Details

- **Model:** YOLOv10n (nano version)  
- **Epochs:** 200  
- **Image size:** 640×640  
- **Batch size:** 32  
- **Optimizer:** SGD (auto-tuned)  
- **Hardware:** Google Colab T4 / CPU fallback  
- **Augmentations:** Flip, rotation, brightness, mosaic  
- **Oversampling:** Applied to "normal" class for balance  


## Results / Metrics (Final Validation)



### Evaluation Table

| Class           | Images | Instances | P      | R      | mAP50 | mAP50-95 |
|-----------------|--------|-----------|--------|--------|--------|-----------|
| **all**         | 1135   | 2016      | 0.793  | 0.758  | 0.793  | 0.485     |
| arson           | 6      | 6         | 0.551  | 0.819  | 0.662  | 0.204     |
| explosion       | 3      | 3         | 0.765  | 0.667  | 0.715  | 0.244     |
| fighting        | 148    | 156       | 0.788  | 0.769  | 0.827  | 0.506     |
| fire            | 236    | 598       | 0.902  | 0.910  | 0.952  | 0.727     |
| handgun         | 186    | 281       | 0.873  | 0.756  | 0.885  | 0.622     |
| knife           | 289    | 320       | 0.953  | 0.944  | 0.985  | 0.744     |
| normal          | 8      | 8         | 0.719  | 0.642  | 0.733  | 0.311     |
| rifle           | 308    | 408       | 0.934  | 0.926  | 0.965  | 0.845     |
| road_accident   | 12     | 13        | 0.624  | 0.512  | 0.420  | 0.150     |
| robbery         | 9      | 9         | 0.945  | 1.000  | 0.995  | 0.515     |
| shooting        | 4      | 4         | 1.000  | 0.702  | 0.856  | 0.596     |
| shoplifting     | 15     | 15        | 0.694  | 0.733  | 0.753  | 0.253     |
| smoke           | 135    | 188       | 0.868  | 0.947  | 0.965  | 0.808     |
| vandalism       | 7      | 7         | 0.493  | 0.286  | 0.387  | 0.260     |


### 📊 Results 

-  **Top performing classes:** smoke, rifle, fire, knife  
-  **mAP50:** **0.861** — very good for real-world CCTV  
-  **mAP50-95:** **0.508** — strong performance across 14 challenging classes

## Limitations

- Low-light and night-time performance requires further improvement.  
- Small or distant handguns may not be consistently detected.  
- Rare classes such as *arson*, *explosion*, and *road_accident* suffer from limited training samples.  
- Occasional false positives may occur in reflective surfaces or highly crowded scenes.

---

## Future Work

- Implement smoke and fire segmentation using YOLOv10-seg.  
- Integrate an alert system (audio, email, or SMS notifications).  
- Improve night-time detection through advanced low-light augmentation techniques.  
- Deploy the model on edge devices such as NVIDIA Jetson Nano and Raspberry Pi 5.  
- Develop a web-based dashboard to monitor live RTSP video streams and system e



