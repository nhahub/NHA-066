// hooks/useSocket.js
import { useEffect, useRef } from "react";

export default function useSocket(url, onMessage) {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = new WebSocket(url);

    socketRef.current.onopen = () => console.log("WebSocket connected");
    socketRef.current.onmessage = (msg) => onMessage?.(msg.data);
    socketRef.current.onerror = (err) => console.error("WS Error:", err);
    socketRef.current.onclose = () => console.log("WebSocket disconnected");

    return () => socketRef.current?.close();
  }, [url]);

  const send = (data) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(data);
    }
  };

  return { send };
}
