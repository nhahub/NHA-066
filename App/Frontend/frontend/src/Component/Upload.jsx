import { useState, useRef } from "react";
import {
  Upload as UploadIcon,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import "./styles/Upload.css";
import { useNavigate } from "react-router-dom";
import { getToken, removeToken } from "../HelperFunctions/token.js";

function Upload() {
  const [state, setState] = useState("idle");
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(HTMLInputElement);
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/Home");
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const droppedFile = files[0];
      if (droppedFile.type.startsWith("video/")) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileInput = (e) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      if (selectedFile.type.startsWith("video/")) {
        setFile(selectedFile);
      }
    }
  };

  const uploadVideo = async () => {
    if (!file) return;

    setState("uploading");

    const token = getToken();

    const formData = new FormData();
    formData.append("video", file);
    formData.append("filename", file.name);
    formData.append("token", token);

    try {
      const response = await fetch("http://localhost:8000/upload-video", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log(data);
      if (data.message == "invaild token") {
        setState("Invalid Token");
        removeToken();
        navigate("/Auth");
      } else if (response.ok) {
        setState("success");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  };

  const handleGoToResults = () => {
    alert("Navigating to results...");
  };

  const handleRetry = () => {
    setState("idle");
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <div className="upload-header">
          <button
            onClick={handleBack}
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
          <h1 className="upload-title">Upload Video</h1>
          <p className="upload-subtitle">
            Choose a video file to analyze for anomalies
          </p>
        </div>

        {state === "idle" && (
          <div className="upload-content">
            <div
              className={`drop-area ${dragActive ? "active" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileInput}
                style={{ display: "none" }}
              />
              <div className="drop-icon">
                <UploadIcon size={48} />
              </div>
              <h3>Drag and drop your video here</h3>
              <p>or click to select a file</p>
              {file && <p className="file-name">Selected: {file.name}</p>}
            </div>

            {file && (
              <div className="upload-actions">
                <button className="upload-button" onClick={uploadVideo}>
                  Upload Video
                </button>
              </div>
            )}
          </div>
        )}

        {state === "uploading" && (
          <div className="upload-content">
            <div className="processing-container">
              <div className="spinner"></div>
              <h3>Processing Video</h3>
              <p>Uploading and analyzing your video...</p>
            </div>
          </div>
        )}

        {state === "success" && (
          <div className="upload-content">
            <div className="success-container">
              <div className="success-icon">
                <CheckCircle size={64} />
              </div>
              <h3>Upload Successful</h3>
              <p>Your video has been uploaded and is being analyzed</p>
              <div className="result-actions">
                <button
                  className="result-button primary"
                  onClick={handleGoToResults}
                >
                  <span>Go to Results</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="upload-content">
            <div className="error-container">
              <div className="error-icon">
                <AlertCircle size={64} />
              </div>
              <h3>Server Error</h3>
              <p>Failed to upload the video. Please try again.</p>
              <div className="result-actions">
                <button
                  className="result-button secondary"
                  onClick={handleRetry}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Upload;
