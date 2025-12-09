import { useState, useRef } from "react";

export default function useDetections() {
  const [logs, setLogs] = useState([]);
  const lastDetectionRef = useRef({}); // { className: timestamp }

  const addDetections = (detections) => {
    const now = Date.now();

    const newLogs = detections
      .filter((det) => {
        const lastTime = lastDetectionRef.current[det.class] || 0;
        // Allow logging if more than 5 seconds passed or if it's a new class
        return now - lastTime > 5000;
      })
      .map((det) => {
        lastDetectionRef.current[det.class] = now; // update last detection time
        return {
          id: now + Math.random(),
          action: det.class,
          timestamp: det.timestamp,
          confidence: det.confidence,
        };
      });

    if (newLogs.length > 0) setLogs((prev) => [...prev, ...newLogs]);
  };

  const resetLogs = () => {
    setLogs([]);
    lastDetectionRef.current = {};
  };

  return {
    logs,
    addDetections,
    resetLogs,
  };
}
