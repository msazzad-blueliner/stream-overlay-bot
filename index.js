import findIcon from "./findIcon.js";

const url = window.location;
const urlParams = new URLSearchParams(url.search);

const meetingId = urlParams.get("meetingId");
const token = urlParams.get("token");
const participantId = urlParams.get("participantId");

const videoContainer = document.getElementById("videoContainer");
const textDiv = document.getElementById("textDiv");

window.VideoSDK.config(token);

// For the scoreboard
const placeholderData = {
  status: "1st Half",
  team: "Team 1",
  against: "Team 2",
  teamLogo: "brazilFlag",
  againstLogo: "australiaFlag",
  teamScore: 0,
  againstScore: 0,
};

const meeting = window.VideoSDK.initMeeting({
  meetingId: meetingId, // required
  name: "recorder", // required
  micEnabled: false,
  webcamEnabled: false,
  participantId: participantId,
});

meeting.join();

//  Display the stream
meeting.on("participant-joined", (participant) => {
  if (participant.displayName !== "Basement Sports") return;

  let videoElement = createVideoElement(
    participant.id,
    participant.displayName
  );
  let audioElement = createAudioElement(participant.id);

  participant.on("stream-enabled", (stream) => {
    setMediaTrack(stream, audioElement, participant, false);
  });
  videoContainer.appendChild(videoElement);
  videoContainer.appendChild(audioElement);
});

// Get published data from the streamer
meeting.on("meeting-joined", () => {
  textDiv.style.display = "none";

  meeting.pubSub.subscribe("CHANGE_BACKGROUND", changeBackground);

  meeting.pubSub.subscribe("UPDATE_SCOREBOARD", updateScoreboard);
});

// TODO see if we need to clean up after the tab closes
// Cleanup after leaving the stream
meeting.on("participant-left", (participant) => {
  let vElement = document.getElementById(`f-${participant.id}`);
  vElement.remove(vElement);

  let aElement = document.getElementById(`a-${participant.id}`);
  aElement.remove(aElement);

  meeting.pubSub.unsubscribe("CHANGE_BACKGROUND", changeBackground);
  meeting.pubSub.unsubscribe("UPDATE_SCOREBOARD", updateScoreboard);

  // TODO: whether we should reset scoreboard or not
  // updateScoreboard(placeholderData);

  // Close the WebSocket when the user leaves the page
  /* window.addEventListener("beforeunload", () => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.close(1000, "Page unloaded"); // 1000 = Normal Closure
  }
}); */
});

// Helper functions
function createVideoElement(pId, name) {
  let videoFrame = document.createElement("div");
  videoFrame.setAttribute("id", `f-${pId}`);
  videoFrame.style.position = "absolute";
  videoFrame.style.top = "0";
  videoFrame.style.left = "0";
  videoFrame.style.width = "100%";
  videoFrame.style.height = "100%";
  videoFrame.style.display = "flex";
  videoFrame.style.justifyContent = "center";
  videoFrame.style.alignItems = "center";
  videoFrame.style.backgroundColor = "black"; // Optional

  let videoElement = document.createElement("video");
  videoElement.classList.add("video-frame");
  videoElement.setAttribute("id", `v-${pId}`);
  videoElement.setAttribute("playsinline", true);
  videoElement.setAttribute("muted", "true");
  videoElement.style.width = "100%";
  videoElement.style.height = "100%";
  videoElement.style.objectFit = "cover"; // Ensures the video fills the screen without distortion

  videoFrame.appendChild(videoElement);

  return videoFrame;
}

function createAudioElement(pId) {
  let audioElement = document.createElement("audio");
  audioElement.setAttribute("autoPlay", "false");
  audioElement.setAttribute("playsInline", "true");
  audioElement.setAttribute("controls", "false");
  audioElement.setAttribute("id", `a-${pId}`);
  audioElement.style.display = "none";
  return audioElement;
}

function setMediaTrack(stream, participant, isLocal) {
  if (stream.kind == "video") {
    isWebCamOn = true;
    const mediaStream = new MediaStream();
    mediaStream.addTrack(stream.track);
    let videoElm = document.getElementById(`v-${participant.id}`);
    videoElm.srcObject = mediaStream;
    videoElm
      .play()
      .catch((error) =>
        console.error("videoElem.current.play() failed", error)
      );
  }
  if (stream.kind == "audio") {
    if (isLocal) {
      isMicOn = true;
    } else {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(stream.track);
      let audioElem = document.getElementById(`a-${participant.id}`);
      audioElem.srcObject = mediaStream;
      audioElem
        .play()
        .catch((error) => console.error("audioElem.play() failed", error));
    }
  }
}

function changeBackground(data) {
  let { message } = data;
  document.body.style.backgroundColor = message;
}

function updateScoreboard(data) {
  const { message, payload } = data;
  /* document.getElementById("teamName").innerText = payload.team
    .slice(0, 2)
    .toUpperCase();
  document.getElementById("againstName").innerText = payload.against
    .slice(0, 2)
    .toUpperCase();
  document.getElementById("teamLogo").src = findIcon(
    payload.teamFlag ?? payload.teamLogo
  );
  document.getElementById("againstLogo").src = findIcon(
    payload.awayFlag ?? payload.awaylogo
  );
  document.getElementById("teamScore").innerText = payload.teamScore;
  document.getElementById("againstScore").innerText = payload.againstScore; */
  document.getElementById("gameStatus").innerText = message; // payload.status;
}
