import express from "express";
import WebSocket from "ws";
import http from "http";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));


const handleListen = () => console.log(`Listening on http://localhost:3000`);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

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

const sockets = [];

wss.on("connection", (socket) => {
  sockets.push(socket);
  socket["nickname"] = "Anonymous";
  socket.on("message", (message) => {
    const parsed = JSON.parse(message.toString());
    console.log(parsed);

    switch (parsed.type) {
      case "message":
        sockets.forEach(s => s.send(`${socket.nickname}: ${parsed.payload.toString()}`));
        break;
      case "nickname":
        console.log('this is called')
        socket["nickname"] = parsed.payload.toString();
        break;
    }
  });
});

server.listen(3000, handleListen);