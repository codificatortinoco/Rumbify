//const { Server } = require("socket.io");
const supabase = require(".supabase.service");
const { channel } = require("./supabase.service");

let io;

const initSocketInstance = (httpServer) => {
 // io = new Server(httpServer, {
  //   path: "/real-time",
  //   cors: {
  //     origin: "*",
  //   },
  // });

  channel = supabase.channel("realtime-events");
};

const emitEvent = async (eventName, data) => {
 // if (!io) {
 //   throw new Error("Socket.io instance is not initialized");
 // }
 // io.emit(eventName, data);
 if (!channel) {
   throw new Error("Supabase channel is not initialized");
 }
 const resp = await channel.send({
    type: "broadcast",  
    event: eventName,
    payload: data,
  });
  
  return resp;
};

module.exports = {
  emitEvent,
  initSocketInstance,
};
