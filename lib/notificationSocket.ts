import { io, Socket } from "socket.io-client";

let notifSocket: Socket | null = null;

export const getNotificationSocket = (): Socket => {
  if (!notifSocket) {
    const socketUrl =
      process.env.NEXT_PUBLIC_NOTIFICATION_SOCKET_URL ||
      process.env.NEXT_PUBLIC_NOTIFICATION_API_URL ||
      "http://localhost:3005";

    notifSocket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    notifSocket.on("connect", () => {
      console.log("[Notification Socket] Connected to notification service:", notifSocket?.id);
    });

    notifSocket.on("disconnect", (reason) => {
      console.log("[Notification Socket] Disconnected:", reason);
    });

    notifSocket.on("connect_error", (error) => {
      console.warn("[Notification Socket] Connection error:", error.message);
    });
  }

  if (!notifSocket.connected) {
    notifSocket.connect();
  }

  return notifSocket;
};

export const joinNotificationUserRoom = (userId: number) => {
  const s = getNotificationSocket();
  s.emit("join-user", userId);
};

export const joinNotificationAdminRoom = () => {
  const s = getNotificationSocket();
  s.emit("join-admin");
};

export const disconnectNotificationSocket = () => {
  if (notifSocket) {
    notifSocket.disconnect();
    notifSocket = null;
  }
};
