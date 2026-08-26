import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_CALL_SOCKET_URL ||
      "http://localhost:3004";

    socket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected to call service:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.warn("[Socket] Connection error:", error.message);
    });
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const joinVendorRoom = (vendorId: number) => {
  const s = getSocket();
  s.emit("join-vendor", vendorId);
};

export const joinUserRoom = (userId: number) => {
  const s = getSocket();
  s.emit("join-user", userId);
};

export const joinCallRoom = (callId: number) => {
  const s = getSocket();
  s.emit("join-call", callId);
};

export const leaveCallRoom = (callId: number) => {
  const s = getSocket();
  s.emit("leave-call", callId);
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
