// hooks/useFrameSender.js
import { useRef } from "react";

export default function useFrameSender(sendFunction) {
  const intervalRef = useRef(null);
  const canvasRef = useRef(null);

  const start = (videoEl, fps = 5) => {
    stop(); // cleanup old interval

    // Create off-screen canvas for compression
    canvasRef.current = document.createElement("canvas");

    intervalRef.current = setInterval(() => {
      if (!videoEl) return;

      const canvas = canvasRef.current;
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

      // Compress frame → WebP or JPEG
      canvas.toBlob(
        (blob) => {
          if (blob) {
            blob.arrayBuffer().then((buffer) => {
              sendFunction(buffer); // send raw binary buffer
            });
          }
        },
        "image/webp", // SUPER small size compared to jpeg
        0.5 // compression quality (0–1)
      );
    }, 1000 / fps);
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return { start, stop };
}
