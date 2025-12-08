import { useState, useRef } from "react";

export default function useDetections() {
  const [logs, setLogs] = useState([]);
  const intervalRef = useRef(null);

  const startSimulation = () => {
    stopSimulation();

    const actions = [
      { action: "fire", severity: "critical" },
      { action: "fight", severity: "critical" },
      { action: "danger", severity: "high" },
      { action: "alert", severity: "medium" },
    ];

    intervalRef.current = setInterval(() => {
      if (Math.random() > 0.6) {
        const randomAction =
          actions[Math.floor(Math.random() * actions.length)];
        const now = new Date();
        const logEntry = {
          id: `${Date.now()}-${Math.random()}`,
          action: randomAction.action,
          timestamp: now.toLocaleTimeString(),
          severity: randomAction.severity,
        };
        setLogs((prev) => [...prev, logEntry]);
      }
    }, 2000);
  };

  const stopSimulation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetLogs = () => {
    setLogs([]);
  };

  return {
    logs,
    startSimulation,
    stopSimulation,
    resetLogs,
  };
}
