// hooks/useMediaStream.js
import { useState, useRef } from "react";

export default function useMediaStream() {
  const [sources, setSources] = useState([]);
  const [stream, setStream] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);

  const loadAvailableSources = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");

      const sourceOptions = [
        { type: "screen", label: "Screen Share" },
        ...videoDevices.map((d, i) => ({
          type: "camera",
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`,
        })),
      ];

      setSources(sourceOptions);
    } catch {
      setSources([{ type: "screen", label: "Screen Share" }]);
    }
  };

  const requestAndStartStream = async (source) => {
    setSelectedSource(source);
    let mediaStream;

    if (source.type === "camera") {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: source.deviceId
          ? { deviceId: { exact: source.deviceId } }
          : true,
        audio: false,
      });
    } else {
      mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });
    }

    setStream(mediaStream);
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    setStream(null);
    setSelectedSource(null);
  };

  return {
    sources,
    stream,
    selectedSource,
    loadAvailableSources,
    requestAndStartStream,
    stopStream,
  };
}
