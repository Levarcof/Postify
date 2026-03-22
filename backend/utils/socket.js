import { Server } from "socket.io";

let io;

export const initIO = (server) => {
  io = new Server(server, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-room", (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.id} joined room: ${conversationId}`);
    });

    socket.on("join-user-room", (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${socket.id} joined user-room: user_${userId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`User ${socket.id} disconnected: ${reason}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
