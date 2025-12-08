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
import { getToken } from "../HelperFunctions/token.js";
import { useNavigate } from "react-router-dom";

// ----------------------

import useSocket from "../hooks/useSocket";
import useFrameSender from "../hooks/useFrameSender";

function RealTime() {
  const [state, setState] = useState("selection");
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const logsContainerRef = useRef(null);
  const navigate = useNavigate();

  const socket = useSocket("ws://localhost:8000/ws", (msg) => {
    console.log("Detection:", msg);
  });

  const handleBack = () => navigate("/Home");

  const { start: startFrameSending, stop: stopFrameSending } = useFrameSender(
    socket.send
  );

  useEffect(() => {
    if (state === "streaming" && videoRef.current) {
      // wait for video to be ready
      const videoElement = videoRef.current;
      const onLoaded = () => {
        startFrameSending(videoElement, 6); // send 4 FPS
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
    setState("selection");
    setError(null);
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "fire":
        return { icon: Flame, color: "#ef4444" };
      case "fight":
        return { icon: Zap, color: "#f97316" };
      default:
        return { icon: AlertCircle, color: "#eab308" };
    }
  };

  if (state === "selection") {
    return (
      <div className="detection-page">
        <div className="detection-container">
          <button
            onClick={handleBack}
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
            onClick={handleBack}
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
          onClick={handleBack}
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

            <div className="video-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="detection-video"
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
