import { useState, useEffect } from "react";
import { ArrowLeft, Play } from "lucide-react";
import "./styles/clip.css";
import { getToken } from "../HelperFunctions/token";
import { useNavigate } from "react-router-dom";

function Clip({ videoId, video_Id }) {
  const [video, setVideo] = useState(null);
  const [clips, setClips] = useState([]);
  const [selectedClip, setSelectedClip] = useState(null);
  const [showFullVideo, setShowFullVideo] = useState(true);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVideo();
  }, [videoId]);

  const handelBack = () => {
    navigate("/Gallery");
  };

  const fetchVideo = async () => {
    try {
      const formData = new FormData();
      formData.append("videoName", video_Id);
      formData.append("token", getToken());

      const response = await fetch("http://localhost:8000/video/getVideo", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        console.log("WORKINNNNNNNNNNNNNNNNNG");
        const blob = await response.blob();
        const videoURL = URL.createObjectURL(blob);

        const video = {
          id: video_Id,
          name: video_Id.substr(9),
          url: videoURL,
        };
        setVideo(video);
        setCurrentVideoUrl(videoURL);

        const response2 = await fetch(
          "http://localhost:8000/video/getClipList",
          {
            method: "POST",
            body: formData,
          }
        );
        const clipdata = await response2.json();
        console.log(clipdata);
        setClips(clipdata);
      }
    } catch (error) {
      console.error("Failed to fetch video and clips:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClip = async (clip) => {
    try {
      const formData = new FormData();
      formData.append("videoName", video_Id);
      formData.append("token", getToken());
      formData.append("clipName", clip.id);

      const response = await fetch("http://localhost:8000/video/getClip", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const videoURL = URL.createObjectURL(blob);

        setCurrentVideoUrl(videoURL);
        setShowFullVideo(false);
        setSelectedClip(clip);
      }
    } catch (error) {
      console.error("Failed to fetch clip:", error);
    }
  };

  const handleFullVideoClick = () => {
    setCurrentVideoUrl(video.url);
    setShowFullVideo(true);
    setSelectedClip(null);
  };

  if (loading) {
    return (
      <div className="clip-page">
        <div className="clip-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading video and clips...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="clip-page">
        <div className="clip-container">
          <p style={{ color: "#ef4444" }}>Failed to load video</p>
        </div>
      </div>
    );
  }

  return (
    <div className="clip-page">
      <div className="clip-container">
        <button
          onClick={handelBack}
          style={{
            background: "none",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.95rem",
            marginBottom: "24px",
            padding: "8px 0",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#cbd5e1")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
        >
          <ArrowLeft size={20} />
          <span>Back to Gallery</span>
        </button>

        <div className="clip-content">
          <div className="main-video-section">
            <div className="video-header">
              <h1 className="video-title">{video.name}</h1>
            </div>

            <div className="video-player-wrapper">
              <video
                key={currentVideoUrl}
                src={currentVideoUrl}
                className="video-player"
                controls
              />
            </div>

            {!showFullVideo && selectedClip && (
              <div className="clip-description-section">
                <div className="description-header">
                  <h3 className="description-title">Anomaly Details</h3>
                </div>
                <p className="description-text">{selectedClip.description}</p>
                <div className="clip-timing">
                  <div className="timing-item">
                    <span className="timing-label">Start Time</span>
                    <span className="timing-value">
                      {selectedClip.startTime}
                    </span>
                  </div>
                  <div className="timing-item">
                    <span className="timing-label">End Time</span>
                    <span className="timing-value">{selectedClip.endTime}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="clips-sidebar">
            <div className="clips-header">
              <h2 className="clips-title">Clips</h2>
              <span className="clips-count">{clips.length}</span>
            </div>

            <div className="clips-list">
              {video_Id.substr(0, 8) !== "RealTime" && (
                <div
                  className={`clip-item full-video-item ${
                    showFullVideo ? "active" : ""
                  }`}
                  onClick={handleFullVideoClick}
                >
                  <div className="clip-thumbnail-wrapper full-video-thumb">
                    <img
                      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAP8AAADGCAMAAAAqo6adAAAABlBMVEUAAAAORKmU5gWIAAAA3klEQVR4nO3PAQEAAAjDoNu/tEEYDdjN1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W39bf1t/W34b/H769AMf5McvaAAAAAElFTkSuQmCC"
                      alt="Full Video"
                      className="clip-thumbnail"
                    />
                    <div className="clip-play-overlay">
                      <Play size={20} />
                    </div>
                  </div>

                  <div className="clip-details">
                    <div className="clip-time-range">
                      <span className="time-badge full-video-badge">
                        Full Video
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {clips.map((clip) => (
                <div
                  key={clip.id}
                  className={`clip-item ${
                    !showFullVideo && selectedClip?.id === clip.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() => fetchClip(clip)}
                >
                  <div className="clip-thumbnail-wrapper">
                    <img
                      src={clip.thumbnail}
                      alt={`Clip ${clip.id}`}
                      className="clip-thumbnail"
                    />
                    <div className="clip-play-overlay">
                      <Play size={20} />
                    </div>
                  </div>

                  <div className="clip-details">
                    <div className="clip-time-range">
                      <span className="time-badge">{clip.startTime}</span>
                      <span className="time-separator">-</span>
                      <span className="time-badge">{clip.endTime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Clip;
