import { useState } from "react";

export default function useSources() {
  const [sources, setSources] = useState([]);

  const loadAvailableSources = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter((d) => d.kind === "videoinput");

      setSources([
        { type: "screen", label: "Screen Share" },
        ...cams.map((d, i) => ({
          type: "camera",
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`,
        })),
      ]);
    } catch {
      setSources([{ type: "screen", label: "Screen Share" }]);
    }
  };

  return { sources, loadAvailableSources };
}
