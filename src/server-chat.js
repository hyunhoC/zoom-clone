import express from "express";
import WebSocket from "ws";
import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home-chat"));


const handleListen = () => console.log(`Listening on http://localhost:3000`);

const server = http.createServer(app);
//const wss = new WebSocket.Server({ server });
const io = new Server(server, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});

instrument(io, {
  auth: false
})

const getPublicRooms = () => {
  const sids = io.sockets.adapter.sids;
  const rooms = io.sockets.adapter.rooms;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

const countRoom = (roomName) => {
  return io.sockets.adapter.rooms.get(roomName)?.size;
}

io.on("connection", socket => {
  socket["nickname"] = "Anonymous";
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName.payload);
    done();
    socket.to(roomName.payload).emit("welcome", socket.nickname, countRoom(roomName));
    io.sockets.emit("room_change", getPublicRooms());
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach(room => socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1));
  });
  socket.on("disconnect", () => {
    io.sockets.emit("room_change", getPublicRooms());
  });
  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
  });
  socket.on("nickname", nickname => socket["nickname"] = nickname);
});

// const handleConnection = (socket) => {
//   console.log("Connected to Browser");
//   socket.on("close", () => {
//     console.log("Disconnected from the Browser")
//   });
//   socket.on("message", message => {
//     console.log(message.toString());
//   })
//   socket.send("hello");
// };

// const sockets = [];

// wss.on("connection", (socket) => {
//   sockets.push(socket);
//   socket["nickname"] = "Anonymous";
//   socket.on("message", (message) => {
//     const parsed = JSON.parse(message.toString());
//     console.log(parsed);

//     switch (parsed.type) {
//       case "message":
//         sockets.forEach(s => s.send(`${socket.nickname}: ${parsed.payload.toString()}`));
//         break;
//       case "nickname":
//         console.log('this is called')
//         socket["nickname"] = parsed.payload.toString();
//         break;
//     }
//   });
// });

server.listen(3000, handleListen);