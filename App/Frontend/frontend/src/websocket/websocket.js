let socket = null;

export const initWebSocket = () => {
  socket = new WebSocket("ws://localhost:8000/ws");

  socket.onopen = () => {
    console.log("WS connected");
  };

  socket.onmessage = (event) => {
    console.log("WS message:", event.data);
  };

  socket.onclose = () => {
    console.log("WS closed");
  };

  socket.onerror = (err) => {
    console.log("WS error:", err);
  };

  return socket;
};

export const sendWSMessage = (msg) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(msg);
  }
};
