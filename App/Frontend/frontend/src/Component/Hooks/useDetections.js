// hooks/useDetections.js
import { useState, useRef } from "react";

export default function useDetections() {
  const [logs, setLogs] = useState([]);
  const intervalRef = useRef(null);

  const startSimulation = () => {
    stopSimulation(); // cleanup old interval

    const actions = [
      { action: "fire", severity: "critical" },
      { action: "fight", severity: "critical" },
      { action: "danger", severity: "high" },
      { action: "alert", severity: "medium" },
    ];

    intervalRef.current = setInterval(() => {
      if (Math.random() > 0.6) {
        const a = actions[Math.floor(Math.random() * actions.length)];
        const now = new Date();
        setLogs((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            action: a.action,
            timestamp: now.toLocaleTimeString(),
            severity: a.severity,
          },
        ]);
      }
    }, 2000);
  };

  const stopSimulation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetLogs = () => setLogs([]);

  return { logs, startSimulation, stopSimulation, resetLogs };
}
