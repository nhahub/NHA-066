import React, { useEffect, useState } from "react";
import { getToken } from "../HelperFunctions/token.js";
import "./styles/gallery.css";
import { ArrowLeft, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Gallery() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const handelHome = () => {
    navigate("/Home");
  };
  const handelVideoSelected = (id) => {
    navigate(`/Clip/${id}`);
  };
  useEffect(() => {
    const loadGallery = async () => {
      try {
        const token = getToken();

        const formData = new FormData();
        formData.append("token", token);

        const response = await fetch(
          "http://localhost:8000/Gallery/getVideos",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();

        const gal = [];

        for (const video of data) {
          gal.push({
            id: video.id,
            name: video.name, // must match backend key
            thumbnail: video.thumbnail, // must match backend key
            clipCount: video.clipsCount, // must match backend key
          });
        }
        console.log(gal);
        setVideos(gal);
        setLoading(false);
      } catch (err) {
        console.error("Error:", err);
      }
    };

    loadGallery();
  }, []);

  return (
    <div className="gallery-page">
      <div className="gallery-container">
        <div className="gallery-header">
          <button
            onClick={handelHome}
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
            <span>Back to Home</span>
          </button>

          <div className="header-content">
            <h1 className="header-title">Video Gallery</h1>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading videos...</p>
          </div>
        ) : (
          <div className="videos-grid">
            {videos.map((video) => (
              <div
                key={video.id}
                className="video-card"
                onClick={() => handelVideoSelected(video.id + "_" + video.name)}
              >
                <div className="video-thumbnail-wrapper">
                  <img
                    src={video.thumbnail}
                    alt={video.name}
                    className="video-thumbnail"
                  />
                  <div className="video-overlay">
                    <div className="play-button">
                      <Play size={32} />
                    </div>
                    <div className="clip-count">
                      <span className="clip-badge">
                        {video.clipCount} clips
                      </span>
                    </div>
                  </div>
                </div>
                <div className="video-info">
                  <h3 className="video-name">{video.name}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Gallery;
