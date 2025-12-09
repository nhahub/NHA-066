import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Camera,
  Monitor,
  Flame,
  Zap,
  AlertCircle,
} from "lucide-react";
import useMediaStream from "../hooks/useMediaStream.js";
import useDetections from "../hooks/useDetections.js";
import "./styles/realtime.css";
import useSocket from "../hooks/useSocket";
import useFrameSender from "../hooks/useFrameSender";
import { getToken } from "../HelperFunctions/token.js";

function RealTime({ onBack }) {
  const [state, setState] = useState("selection");
  const [error, setError] = useState(null);
  const [detections, setDetections] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const logsContainerRef = useRef(null);
  const token = getToken();
  const socket = useSocket(`ws://localhost:8000/ws?token=${token}`, (msg) => {
    try {
      const data = JSON.parse(msg);
      console.log("Detection:", data);

      if (data.type === "detection" && data.detections) {
        setDetections(data.detections);

        // Add to logs
        data.detections.forEach((det) => {
          const logEntry = {
            id: Date.now() + Math.random(),
            action: det.class,
            timestamp: det.timestamp,
            confidence: det.confidence,
          };
          // You can call a function to add this to your logs
          console.log("New detection log:", logEntry);
        });
      } else {
        setDetections([]);
      }
    } catch (e) {
      console.log("Non-JSON message:", msg);
    }
  });

  const { start: startFrameSending, stop: stopFrameSending } = useFrameSender(
    socket.send
  );

  // Draw bounding boxes on canvas
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");

    // Match canvas size to video size
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bounding boxes
    detections.forEach((det) => {
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
  }, [detections]);

  useEffect(() => {
    if (state === "streaming" && videoRef.current) {
      const videoElement = videoRef.current;
      const onLoaded = () => {
        startFrameSending(videoElement, 10); // send 4 FPS
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

  const { logs, startSimulation, stopSimulation, resetLogs } = useDetections();

  useEffect(() => {
    loadAvailableSources();
  }, []);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop =
        logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleStart = async (source) => {
    try {
      setState("requesting");
      setError(null);
      await requestAndStartStream(source);
      setState("streaming");
      resetLogs();
      startSimulation();
    } catch (error) {
      console.error("Failed to start stream:", error);
      setError("Failed to access the selected source. Please try again.");
      setState("selection");
    }
  };

  const handleStop = () => {
    stopFrameSending();
    stopSimulation();
    stopMedia();
    resetLogs();
    setDetections([]);
    setState("selection");
    setError(null);
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
          <button
            onClick={onBack}
            className="back-button"
            onMouseEnter={(e) => (e.currentTarget.style.color = "#cbd5e1")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>

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
          <button
            onClick={onBack}
            className="back-button"
            onMouseEnter={(e) => (e.currentTarget.style.color = "#cbd5e1")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>

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
        <button
          onClick={onBack}
          className="back-button"
          onMouseEnter={(e) => (e.currentTarget.style.color = "#cbd5e1")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>

        <div className="streaming-content">
          <div className="stream-section">
            <div className="stream-header">
              <h2 className="stream-title">Live Detection Stream</h2>
              <button onClick={handleStop} className="stop-button">
                Stop Stream
              </button>
            </div>

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
