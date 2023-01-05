const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

const getCameras = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === 'videoinput');
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach(camera => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    })
  } catch (e) {
    console.log(e);
  }
}

const getMedia = async (deviceId) => {
  const initialContrains = {
    audio: true,
    video: { facingMode: "user"},
  };
  const cameraConstrains = {
    audio: true,
    video: { deviceId: {exact: deviceId }},
  };

  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? initialContrains : cameraConstrains
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (error) {
    console.log(error);
  }
}

const handleMuteClick = (event) => {
  myStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
  if (!muted) {
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}

const handleCameraClick = (event) => {
  myStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
  if (cameraOff) {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Turn Camera On"
    cameraOff = true;
  }
}

const handleCameraChange = async () => {
  await getMedia(camerasSelect.value);
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection.getSenders().find(sender => sender.track.kind === "video");
    videoSender.replaceTrack();
  }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);


// Welcome Form (choose a room)

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

const startMedia = async () => {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}

const handleWelcomeSubmit = async (e) => {
  e.preventDefault();
  const input = welcomeForm.querySelector("input");
  await startMedia();
  socket.emit("join_room", input.value);
  roomName = input.value;
  input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);


// Socket Code

socket.on("welcome", async () => {
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
});

socket.on("answer", answer => {
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", ice => {
  myPeerConnection.addIceCandidate(ice);
});


// RTC Code

const makeConnection = () => {
  myPeerConnection = new RTCPeerConnection();
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStrem);
  myStream.getTracks().forEach(track => myPeerConnection.addTrack(track, myStream));
}

const handleIce = data => {
  socket.emit("ice", data.candidate, roomName);
}

const handleAddStrem = data => {
  const peerStream = document.getElementById('peersStream');
  peerStream.srcObject = data.stream;
}