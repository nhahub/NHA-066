import { useState } from "react";

export default function useMediaStream() {
  const [sources, setSources] = useState([]);
  const [stream, setStream] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);

  const loadAvailableSources = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );

      const sourceOptions = [
        {
          type: "screen",
          label: "Screen Share",
        },
        ...videoDevices.map((device, index) => ({
          type: "camera",
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
        })),
      ];

      setSources(sourceOptions);
    } catch (error) {
      console.error("Failed to enumerate devices:", error);
      setSources([
        {
          type: "screen",
          label: "Screen Share",
        },
      ]);
    }
  };

  const requestAndStartStream = async (source) => {
    setSelectedSource(source);
    let mediaStream;

    if (source.type === "camera") {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: source.deviceId
          ? { deviceId: { exact: source.deviceId } }
          : { facingMode: "user" },
        audio: false,
      });
    } else {
      mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
        },
        audio: false,
      });
    }

    setStream(mediaStream);
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
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
