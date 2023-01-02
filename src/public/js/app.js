const messageList = document.querySelector("ul");
const messageForm = document.querySelector("#message");
const nicknameForm = document.querySelector("#nick");

const socket = new WebSocket(`ws://${window.location.host}`);

// socket.addEventListener("open", () => {
//   console.log("Connected to Server");
// });

socket.addEventListener("message", (message) => {
  const li = document.createElement("li");
  li.innerText = message.data;
  messageList.append(li);
});

// socket.addEventListener("close", () => {
//   console.log("Disconnected from Server");
// });

// setTimeout(() => {
//   socket.send("hello from the browser!");
// }, 1000);

const makeMessage = (type, payload) => {
  const msg = {type, payload};
  return JSON.stringify(msg)
}

const handleSubmit = (event) => {
  event.preventDefault();
  const input = messageForm.querySelector("input");
  socket.send(makeMessage("message", input.value));
  const li = document.createElement("li");
  li.innerText = `You: ${input.value}`;
  messageList.append(li);
  input.value = "";
};

const handleNickSubmit = (event) => {
  event.preventDefault();
  const input = nicknameForm.querySelector("input");
  socket.send(makeMessage("nickname", input.value));
  input.value = "";
}

messageForm.addEventListener("submit", handleSubmit);
nicknameForm.addEventListener("submit", handleNickSubmit);