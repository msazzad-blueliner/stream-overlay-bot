const url = window.location;
const urlParams = new URLSearchParams(url.search);

const meetingId = urlParams.get("meetingId");
const token = urlParams.get("token");
const participantId = urlParams.get("participantId");

const videoContainer = document.getElementById("videoContainer");
const textDiv = document.getElementById("textDiv");

window.VideoSDK.config(token);

const meeting = window.VideoSDK.initMeeting({
  meetingId: meetingId, // required
  name: "recorder", // required
  micEnabled: false,
  webcamEnabled: false,
  participantId: participantId,
});

meeting.join();

meeting.on("meeting-joined", () => {
  textDiv.style.display = "none";

  meeting.pubSub.subscribe("CHANGE_BACKGROUND", (data) => {
    let { message } = data;
    document.body.style.backgroundColor = message;
  });
});

//  participant joined
meeting.on("participant-joined", (participant) => {
  let videoElement = createVideoElement(
    participant.id,
    participant.displayName
  );
  let audioElement = createAudioElement(participant.id);

  participant.on("stream-enabled", (stream) => {
    setTrack(stream, audioElement, participant, false);
  });
  videoContainer.appendChild(videoElement);
  videoContainer.appendChild(audioElement);
});

// participants left
meeting.on("participant-left", (participant) => {
  let vElement = document.getElementById(`f-${participant.id}`);
  vElement.remove(vElement);

  let aElement = document.getElementById(`a-${participant.id}`);
  aElement.remove(aElement);
});

// creating video element
function createVideoElement(pId, name) {
  let videoFrame = document.createElement("div");
  videoFrame.setAttribute("id", `f-${pId}`);

  //create video
  let videoElement = document.createElement("video");
  videoElement.classList.add("video-frame");
  videoElement.setAttribute("id", `v-${pId}`);
  videoElement.setAttribute("playsinline", true);
  videoElement.setAttribute("width", "300");
  videoElement.muted = true;
  videoFrame.appendChild(videoElement);

  let displayName = document.createElement("div");
  displayName.innerHTML = `Name : ${name}`;
  videoFrame.appendChild(displayName);

  return videoFrame;
}

// creating audio element
function createAudioElement(pId) {
  let audioElement = document.createElement("audio");
  audioElement.setAttribute("autoPlay", "false");
  audioElement.setAttribute("playsInline", "true");
  audioElement.setAttribute("controls", "false");
  audioElement.setAttribute("id", `a-${pId}`);
  audioElement.style.display = "none";
  return audioElement;
}

// setting media track
function setTrack(stream, audioElement, participant, isLocal) {
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
      audioElement.srcObject = mediaStream;
      audioElement
        .play()
        .catch((error) => console.error("audioElem.play() failed", error));
    }
  }
}
