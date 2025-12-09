import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Camera,
  Monitor,
  Flame,
  Zap,
  AlertCircle,
  Loader2,
} from "lucide-react";
import useMediaStream from "../hooks/useMediaStream.js";
import useDetections from "../hooks/useDetections.js";
import "./styles/realtime.css";
import useSocket from "../hooks/useSocket";
import useFrameSender from "../hooks/useFrameSender";
import { getToken } from "../HelperFunctions/token.js";
import { useNavigate } from "react-router-dom";

function RealTime() {
  const [state, setState] = useState("selection");
  const [error, setError] = useState(null);
  const [detections, setDetections] = useState([]);
  const [isEnding, setIsEnding] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const logsContainerRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const token = getToken();
  const navigate = useNavigate();

  const handleBack = () => {
    // Clean up resources before navigating
    if (state === "streaming") {
      stopFrameSending();
      stopMedia();
      setDetections([]);
    }
    navigate("/Home");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      stopFrameSending();
      stopMedia();
    };
  }, []);

  const socket = useSocket(
    `ws://localhost:8000/ws?token=${token}`,
    (msg) => {
      try {
        const data = JSON.parse(msg);
        console.log("Detection:", data);

        if (data.type === "detection" && data.detections) {
          addDetections(data.detections);
          setDetections(data.detections);

          // Add to logs
          data.detections.forEach((det) => {
            const logEntry = {
              id: Date.now() + Math.random(),
              action: det.class,
              timestamp: det.timestamp,
              confidence: det.confidence,
            };
            console.log("New detection log:", logEntry);
          });
        } else {
          setDetections([]);
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
        setError("Error receiving detection data");
      }
    },
    (error) => {
      console.error("WebSocket error:", error);
      setError("Connection error. Please check your connection and try again.");
    }
  );

  const { start: startFrameSending, stop: stopFrameSending } = useFrameSender(
    socket.send
  );

  // Check if stream processing is complete
  const checkStreamEnd = async () => {
    try {
      const formData = new FormData();
      formData.append("token", token);

      const response = await fetch("http://localhost:8000/tasks_finished", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to check stream status");
      }

      const data = await response.json();
      console.log("Stream status:", data);
      return data.finished || false;
    } catch (error) {
      console.error("Error checking stream status:", error);
      // Return true to stop polling on error
      return true;
    }
  };

  const handleEndStream = async () => {
    try {
      setIsEnding(true);
      setError(null);

      // Stop media and frame sending immediately
      stopFrameSending();
      stopMedia();
      setDetections([]);

      pollingIntervalRef.current = setInterval(async () => {
        const isComplete = await checkStreamEnd();
        console.log(isComplete);
        if (isComplete) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          setIsEnding(false);
          setState("selection");
          resetLogs();
          navigate(`/Gallery`);
        }
      }, 1000);
    } catch (error) {
      console.error("Error ending stream:", error);
      setError("Failed to end stream properly. Please try again.");
      setIsEnding(false);

      // Cleanup anyway
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  };

  // Draw bounding boxes on canvas
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.error("Failed to get canvas context");
      return;
    }

    try {
      // Match canvas size to video size
      canvas.width = video.videoWidth || video.clientWidth;
      canvas.height = video.videoHeight || video.clientHeight;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw bounding boxes
      detections.forEach((det) => {
        if (!det.bbox) return;

        const { x1, y1, x2, y2 } = det.bbox;
        const width = x2 - x1;
        const height = y2 - y1;

        // Scale coordinates to canvas size
        const scaleX = canvas.width / video.videoWidth;
        const scaleY = canvas.height / video.videoHeight;

        const scaledX = x1 * scaleX;
        const scaledY = y1 * scaleY;
        const scaledWidth = width * scaleX;
        const scaledHeight = height * scaleY;

        // Draw box
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 3;
        ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

        // Draw label background
        const label = `${det.class} ${(det.confidence * 100).toFixed(0)}%`;
        ctx.font = "16px Arial";
        const textWidth = ctx.measureText(label).width;

        ctx.fillStyle = "#00ff00";
        ctx.fillRect(scaledX, scaledY - 25, textWidth + 10, 25);

        // Draw label text
        ctx.fillStyle = "#000";
        ctx.fillText(label, scaledX + 5, scaledY - 7);
      });
    } catch (error) {
      console.error("Error drawing detections:", error);
    }
  }, [detections]);

  useEffect(() => {
    if (state === "streaming" && videoRef.current) {
      const videoElement = videoRef.current;
      const onLoaded = () => {
        try {
          startFrameSending(videoElement, 10); // send 10 FPS
        } catch (error) {
          console.error("Error starting frame sending:", error);
          setError("Failed to start frame sending");
        }
      };

      videoElement.addEventListener("loadeddata", onLoaded);

      return () => {
        videoElement.removeEventListener("loadeddata", onLoaded);
      };
    }
  }, [state]);

  const {
    sources,
    stream,
    selectedSource,
    loadAvailableSources,
    requestAndStartStream,
    stopStream: stopMedia,
  } = useMediaStream();

  const { logs, addDetections, resetLogs } = useDetections();

  useEffect(() => {
    try {
      loadAvailableSources();
    } catch (error) {
      console.error("Error loading sources:", error);
      setError("Failed to load available sources");
    }
  }, []);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop =
        logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (videoRef.current && stream) {
      try {
        videoRef.current.srcObject = stream;
      } catch (error) {
        console.error("Error setting video stream:", error);
        setError("Failed to display video stream");
      }
    }
  }, [stream]);

  const handleStart = async (source) => {
    try {
      setState("requesting");
      setError(null);
      await requestAndStartStream(source);
      setState("streaming");
      resetLogs();
    } catch (error) {
      console.error("Failed to start stream:", error);
      setError("Failed to access the selected source. Please try again.");
      setState("selection");
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "person":
        return { icon: AlertCircle, color: "#3b82f6" };
      case "car":
      case "truck":
        return { icon: Zap, color: "#f97316" };
      case "fire":
      case "fire hydrant":
        return { icon: Flame, color: "#ef4444" };
      default:
        return { icon: AlertCircle, color: "#eab308" };
    }
  };

  if (state === "selection") {
    return (
      <div className="detection-page">
        <div className="detection-container">
          {!isEnding && (
            <button
              onClick={handleBack}
              className="back-button"
              onMouseEnter={(e) => (e.currentTarget.style.color = "#cbd5e1")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
            >
              <ArrowLeft size={20} />
              <span>Back to Home</span>
            </button>
          )}

          <div className="selection-section">
            <h2 className="selection-title">Select Input Source</h2>

            {error && (
              <div className="error-message">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="sources-grid">
              {sources.map((source) => (
                <button
                  key={source.type === "screen" ? "screen" : source.deviceId}
                  onClick={() => handleStart(source)}
                  className={`source-card ${
                    source.type === "screen" ? "screen-card" : "camera-card"
                  }`}
                >
                  {source.type === "screen" ? (
                    <Monitor size={32} />
                  ) : (
                    <Camera size={32} />
                  )}
                  <span>{source.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === "requesting") {
    return (
      <div className="detection-page">
        <div className="detection-container">
          {!isEnding && (
            <button
              onClick={handleBack}
              className="back-button"
              onMouseEnter={(e) => (e.currentTarget.style.color = "#cbd5e1")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
            >
              <ArrowLeft size={20} />
              <span>Back to Home</span>
            </button>
          )}

          <div className="selection-section">
            <div className="requesting-content">
              <div className="requesting-spinner"></div>
              <h2 className="requesting-title">Requesting Access</h2>
              <p className="requesting-subtitle">
                Please allow access to{" "}
                {selectedSource?.type === "screen"
                  ? "share your screen"
                  : "use your camera"}{" "}
                in the browser popup
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="detection-page">
      <div className="detection-container streaming">
        <div className="streaming-content">
          <div className="stream-section">
            <div className="stream-header">
              <h2 className="stream-title">Live Detection Stream</h2>
              <button
                onClick={handleEndStream}
                className="stop-button"
                disabled={isEnding}
                style={{
                  opacity: isEnding ? 0.6 : 1,
                  cursor: isEnding ? "not-allowed" : "pointer",
                }}
              >
                {isEnding ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    Ending Stream...
                  </>
                ) : (
                  "End Stream"
                )}
              </button>
            </div>

            {isEnding && (
              <div
                style={{
                  marginBottom: "1rem",
                  padding: "1rem",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "#3b82f6",
                  }}
                >
                  <Loader2 size={20} className="spinner" />
                  <span>Processing stream data, please wait...</span>
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  marginBottom: "1rem",
                  padding: "1rem",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "#ef4444",
                }}
              >
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="video-container" style={{ position: "relative" }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="detection-video"
              />
              <canvas
                ref={canvasRef}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>

          <div className="logs-panel">
            <div className="logs-header">
              <h3 className="logs-title">Detection Log</h3>
              <span className="logs-count">{logs.length}</span>
            </div>

            <div className="logs-container" ref={logsContainerRef}>
              {logs.length === 0 ? (
                <div className="logs-empty">
                  <AlertCircle size={32} />
                  <p>Waiting for detections...</p>
                </div>
              ) : (
                logs.map((log) => {
                  const { icon: IconComponent, color } = getActionIcon(
                    log.action
                  );
                  return (
                    <div
                      key={log.id}
                      className="log-entry"
                      style={{ borderLeftColor: color }}
                    >
                      <div className="log-icon-wrapper" style={{ color }}>
                        <IconComponent size={18} />
                      </div>
                      <div className="log-content">
                        <div className="log-action" style={{ color }}>
                          {log.action.toUpperCase()}
                          {log.confidence &&
                            ` (${(log.confidence * 100).toFixed(0)}%)`}
                        </div>
                        <div className="log-time">{log.timestamp}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RealTime;
