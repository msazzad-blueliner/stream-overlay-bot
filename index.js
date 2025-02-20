import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";
const SOCKET_API_URL = "https://bsports-socket-staging.herokuapp.com/";
const url = window.location;
const urlParams = new URLSearchParams(url.search);

const meetingId = urlParams.get("meetingId");
const matchId = urlParams.get("matchId");
const token = urlParams.get("token");
const participantId = urlParams.get("participantId");

const videoContainer = document.getElementById("videoContainer");
const textDiv = document.getElementById("textDiv");

const spinner = document.getElementById("spinner");

const minutesElement = document.getElementById("timer-minutes");
const secondsElement = document.getElementById("timer-seconds");

window.VideoSDK.config(token);

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
    setMediaTrack(stream, participant, false);
  });
  videoContainer.appendChild(videoElement);
  videoContainer.appendChild(audioElement);
});

// Hide fallback message when participants join the stream
meeting.on("meeting-joined", () => {
  textDiv.style.display = "none";
});

// TODO unsubscribe when the participant leaves
// Cleanup after leaving the stream
meeting.on("participant-left", (participant) => {
  let vElement = document.getElementById(`f-${participant.id}`);
  vElement.remove();

  let aElement = document.getElementById(`a-${participant.id}`);
  aElement.remove();

  /* meeting.pubSub.unsubscribe("CHANGE_BACKGROUND", changeBackground);
  meeting.pubSub.unsubscribe("UPDATE_SCOREBOARD", updateScoreboard); */
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
  audioElement.setAttribute("autoplay", "false");
  audioElement.setAttribute("playsInline", "true");
  audioElement.setAttribute("controls", "false");
  audioElement.setAttribute("id", `a-${pId}`);
  audioElement.style.display = "none";
  return audioElement;
}

function setMediaTrack(stream, participant, isLocal) {
  if (stream.kind == "video") {
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
    if (!isLocal) {
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

function disableSpinner() {
  spinner.style.display = "none";
}

function updateTimer(currentTime) {
  const minutes = Math.floor(currentTime / 60);
  const seconds = Math.floor(currentTime % 60);
  minutesElement.textContent = minutes.toString();
  secondsElement.textContent = seconds.toString().padStart(2, "0");
}

function updateScoreboard(data) {
  const { currentTime, gameType } = data;
  if (typeof currentTime === "number" && gameType !== "baseball") {
    // baseball doesn't have timer
    updateTimer(currentTime);
  }

  if (
    typeof gameType !== "string" ||
    gameType.trim() === "" ||
    typeof payload !== "object" ||
    payload === null ||
    Object.keys(payload)?.length === 0
  )
    return;

  if (gameType === "soccer" || gameType === "hockey") {
    const { payload } = data;
    console.log("updating soccer data", payload);

    document.getElementById("teamName").innerText = payload?.team
      ?.slice(0, 3)
      ?.toUpperCase();
    document.getElementById("againstName").innerText = payload?.against
      ?.slice(0, 3)
      ?.toUpperCase();
    document.getElementById("teamLogo").src = findIcon(payload?.teamLogo);
    document.getElementById("againstLogo").src = findIcon(payload?.againstLogo);
    document.getElementById("teamScore").innerText = payload?.teamScore;
    document.getElementById("againstScore").innerText = payload?.againstScore;
    document.getElementById("gameStatus").innerText = payload?.status;

    document.getElementById("soccerBoard").style.display = "block";
  }

  if (gameType === "baseball") {
    const {
      awayteamlogo,
      hometeamlogo,
      awayTeam,
      homeTeam,
      extraInning,
      teamOneRuns,
      t1ExtraRuns,
      teamTwoRuns,
      t2ExtraRuns,
      team,
      outs,
      inning,
      baseLoading,
      balls,
      strikes,
    } = data.payload;

    console.log("updating soccer data", payload);

    document.getElementById("hometeamlogo").src = hometeamlogo;
    document.getElementById("awayteamlogo").src = awayteamlogo;
    document.getElementById("homeTeam").textContent = homeTeam;
    document.getElementById("awayTeam").textContent = awayTeam;
    document.getElementById("teamOneRuns").textContent =
      teamOneRuns.reduce((acc, val) => acc + val, 0) + extraInning
        ? t1ExtraRuns.reduce((acc, val) => acc + val, 0)
        : 0;
    document.getElementById("teamTwoRuns").textContent =
      teamTwoRuns.reduce((acc, val) => acc + val, 0) + extraInning
        ? t2ExtraRuns.reduce((acc, val) => acc + val, 0)
        : 0;
    document.getElementById("caretIcon").innerHTML = team
      ? "&#9650;"
      : "&#9660;";

    document.getElementById("out1").style.backgroundColor =
      outs >= 1 ? "white" : "rgba(255, 255, 255, 0.3)";
    document.getElementById("out2").style.backgroundColor =
      outs >= 2 ? "white" : "rgba(255, 255, 255, 0.3)";
    document.getElementById("out3").style.backgroundColor =
      outs === 3 ? "white" : "rgba(255, 255, 255, 0.3)";

    // as per the BaseBallFullGameScreenScoreCard component in the app
    document.getElementById("inning").textContent = switchInnings(inning + 1);
    document.getElementById("base1").textContent = baseLoading[1]
      ? { backgroundColor: "white" }
      : null;
    document.getElementById("base2").textContent = baseLoading[2]
      ? { backgroundColor: "white" }
      : null;
    document.getElementById("base3").textContent = baseLoading[3]
      ? { backgroundColor: "white" }
      : null;
    document.getElementById("balls").textContent = balls;
    document.getElementById("strikes").textContent = strikes;

    document.getElementById("baseballBoard").style.display = "block";
    document.getElementById("timer-container").style.display = "none"; // baseball doesn't have timer
  }

  disableSpinner();
}

const socket = io(SOCKET_API_URL, {
  withCredentials: true,
  extraHeaders: {
    "Access-Control-Allow-Origin": "*",
  },
  transports: ["websocket", "polling"],
});

socket.on(`game-msg:${matchId}`, (payload) => {
  console.log(payload);

  updateScoreboard(payload);
});

function switchInnings(inningNumber) {
  switch (inningNumber) {
    case 1:
      return "1st";
      break;
    case 2:
      return "2nd";
      break;
    case 3:
      return "3rd";
      break;
    case "X":
      return "Extra";
    default:
      return "1st";
      break;
  }
}

const findIcon = (item) => {
  switch (item) {
    case "newZealandFlag":
      return "./assets/countriesFlag/NewZealand.png";
    case "zambiaFlag":
      return "./assets/countriesFlag/Zambia.png";
    case "vietnamFlag":
      return "./assets/countriesFlag/Vietnam.png";
    case "swedenFlag":
      return "./assets/countriesFlag/Sweden.png";
    case "southAfricaFlag":
      return "./assets/countriesFlag/SouthAfrica.png";
    case "philippinesFlag":
      return "./assets/countriesFlag/Philippines.png";
    case "panamaFlag":
      return "./assets/countriesFlag/Panama.png";
    case "nigeriaFlag":
      return "./assets/countriesFlag/Nigeria.png";
    case "jamaicaFlag":
      return "./assets/countriesFlag/Jamaica.png";
    case "italyFlag":
      return "./assets/countriesFlag/Italy.png";
    case "irelandFlag":
      return "./assets/countriesFlag/Ireland.png";
    case "haitiFlag":
      return "./assets/countriesFlag/Haiti.png";
    case "colombiaFlag":
      return "./assets/countriesFlag/Colombia.png";
    case "chinaFlag":
      return "./assets/countriesFlag/China.png";
    case "argentinaFlag":
      return "./assets/countriesFlag/Argentina.png";
    case "australiaFlag":
      return "./assets/countriesFlag/Australia.png";
    case "belgiumFlag":
      return "./assets/countriesFlag/Belgium.png";
    case "brazilFlag":
      return "./assets/countriesFlag/Brazil.png";
    case "cameroonFlag":
      return "./assets/countriesFlag/Cameroon.png";
    case "canadaFlag":
      return "./assets/countriesFlag/Canada.png";
    case "costaRicaFlag":
      return "./assets/countriesFlag/CostaRica.png";
    case "croatiaFlag":
      return "./assets/countriesFlag/Croatia.png";
    case "denmarkFlag":
      return "./assets/countriesFlag/Denmark.png";
    case "ecuadorFlag":
      return "./assets/countriesFlag/Ecuador.png";
    case "englandFlag":
      return "./assets/countriesFlag/England.png";
    case "franceFlag":
      return "./assets/countriesFlag/France.png";
    case "germanyFlag":
      return "./assets/countriesFlag/Germany.png";
    case "ghanaFlag":
      return "./assets/countriesFlag/Ghana.png";
    case "iranFlag":
      return "./assets/countriesFlag/Iran.png";
    case "japanFlag":
      return "./assets/countriesFlag/Japan.png";
    case "mexicoFlag":
      return "./assets/countriesFlag/Mexico.png";
    case "moroccoFlag":
      return "./assets/countriesFlag/Morocco.png";
    case "netherlandsFlag":
      return "./assets/countriesFlag/Netherlands.png";
    case "polandFlag":
      return "./assets/countriesFlag/Poland.png";
    case "portugalFlag":
      return "./assets/countriesFlag/Portugal.png";
    case "qatarFlag":
      return "./assets/countriesFlag/Qatar.png";
    case "saudiArabiaFlag":
      return "./assets/countriesFlag/SaudiArabia.png";
    case "senegalFlag":
      return "./assets/countriesFlag/Senegal.png";
    case "serbiaFlag":
      return "./assets/countriesFlag/Serbia.png";
    case "southKoreaFlag":
      return "./assets/countriesFlag/SouthKorea.png";
    case "spainFlag":
      return "./assets/countriesFlag/Spain.png";
    case "switzerlandFlag":
      return "./assets/countriesFlag/Switzerland.png";
    case "tunisiaFlag":
      return "./assets/countriesFlag/Tunisia.png";
    case "uruguayFlag":
      return "./assets/countriesFlag/Uruguay.png";
    case "usaFlag":
      return "./assets/countriesFlag/USA.png";
    case "walesFlag":
      return "./assets/countriesFlag/Wales.png";
    case "bear_colorless":
      return "./assets/teams/bears/bear_colorless.png";
    case "bear_darkcyan":
      return "./assets/teams/bears/bear_darkcyan.png";
    case "bear_forestgreen":
      return "./assets/teams/bears/bear_forestgreen.png";
    case "bear_green":
      return "./assets/teams/bears/bear_green.png";
    case "bear_grey":
      return "./assets/teams/bears/bear_grey.png";
    case "bear_navyblue":
      return "./assets/teams/bears/bear_navyblue.png";
    case "bear_orange":
      return "./assets/teams/bears/bear_orange.png";
    case "bear_pink":
      return "./assets/teams/bears/bear_pink.png";
    case "bear_purple":
      return "./assets/teams/bears/bear_purple.png";
    case "bear_skyblue":
      return "./assets/teams/bears/bear_skyblue.png";
    case "bear_tomato":
      return "./assets/teams/bears/bear_tomato.png";
    case "bear_yellow":
      return "./assets/teams/bears/bear_yellow.png";
    case "bengel_tiger_colorless":
      return "./assets/teams/bengel_tigers/bengel_tiger_colorless.png";
    case "bengel_tiger_darkcyan":
      return "./assets/teams/bengel_tigers/bengel_tiger_darkcyan.png";
    case "bengel_tiger_forestgreen":
      return "./assets/teams/bengel_tigers/bengel_tiger_forestgreen.png";
    case "bengel_tiger_green":
      return "./assets/teams/bengel_tigers/bengel_tiger_green.png";
    case "bengel_tiger_grey":
      return "./assets/teams/bengel_tigers/bengel_tiger_grey.png";
    case "bengel_tiger_navyblue":
      return "./assets/teams/bengel_tigers/bengel_tiger_navyblue.png";
    case "bengel_tiger_orange":
      return "./assets/teams/bengel_tigers/bengel_tiger_orange.png";
    case "bengel_tiger_pink":
      return "./assets/teams/bengel_tigers/bengel_tiger_pink.png";
    case "bengel_tiger_purple":
      return "./assets/teams/bengel_tigers/bengel_tiger_purple.png";
    case "bengel_tiger_skyblue":
      return "./assets/teams/bengel_tigers/bengel_tiger_skyblue.png";
    case "bengel_tiger_tomato":
      return "./assets/teams/bengel_tigers/bengel_tiger_tomato.png";
    case "bengel_tiger_yellow":
      return "./assets/teams/bengel_tigers/bengel_tiger_yellow.png";
    case "boar_colorless":
      return "./assets/teams/boars/boar_colorless.png";
    case "boar_darkcyan":
      return "./assets/teams/boars/boar_darkcyan.png";
    case "boar_forestgreen":
      return "./assets/teams/boars/boar_forestgreen.png";
    case "boar_green":
      return "./assets/teams/boars/boar_green.png";
    case "boar_grey":
      return "./assets/teams/boars/boar_grey.png";
    case "boar_navyblue":
      return "./assets/teams/boars/boar_navyblue.png";
    case "boar_orange":
      return "./assets/teams/boars/boar_orange.png";
    case "boar_pink":
      return "./assets/teams/boars/boar_pink.png";
    case "boar_purple":
      return "./assets/teams/boars/boar_purple.png";
    case "boar_skyblue":
      return "./assets/teams/boars/boar_skyblue.png";
    case "boar_tomato":
      return "./assets/teams/boars/boar_tomato.png";
    case "boar_yellow":
      return "./assets/teams/boars/boar_yellow.png";
    case "bull_colorless":
      return "./assets/teams/bulls/bull_colorless.png";
    case "bull_darkcyan":
      return "./assets/teams/bulls/bull_darkcyan.png";
    case "bull_forestgreen":
      return "./assets/teams/bulls/bull_forestgreen.png";
    case "bull_green":
      return "./assets/teams/bulls/bull_green.png";
    case "bull_grey":
      return "./assets/teams/bulls/bull_grey.png";
    case "bull_navyblue":
      return "./assets/teams/bulls/bull_navyblue.png";
    case "bull_orange":
      return "./assets/teams/bulls/bull_orange.png";
    case "bull_pink":
      return "./assets/teams/bulls/bull_pink.png";
    case "bull_purple":
      return "./assets/teams/bulls/bull_purple.png";
    case "bull_skyblue":
      return "./assets/teams/bulls/bull_skyblue.png";
    case "bull_tomato":
      return "./assets/teams/bulls/bull_tomato.png";
    case "bull_yellow":
      return "./assets/teams/bulls/bull_yellow.png";
    case "croc_colorless":
      return "./assets/teams/crocs/croc_colorless.png";
    case "croc_darkcyan":
      return "./assets/teams/crocs/croc_darkcyan.png";
    case "croc_forestgreen":
      return "./assets/teams/crocs/croc_forestgreen.png";
    case "croc_green":
      return "./assets/teams/crocs/croc_green.png";
    case "croc_grey":
      return "./assets/teams/crocs/croc_grey.png";
    case "croc_navyblue":
      return "./assets/teams/crocs/croc_navyblue.png";
    case "croc_orange":
      return "./assets/teams/crocs/croc_orange.png";
    case "croc_pink":
      return "./assets/teams/crocs/croc_pink.png";
    case "croc_purple":
      return "./assets/teams/crocs/croc_purple.png";
    case "croc_skyblue":
      return "./assets/teams/crocs/croc_skyblue.png";
    case "croc_tomato":
      return "./assets/teams/crocs/croc_tomato.png";
    case "croc_yellow":
      return "./assets/teams/crocs/croc_yellow.png";
    case "dog_colorless":
      return "./assets/teams/dogs/dog_colorless.png";
    case "dog_darkcyan":
      return "./assets/teams/dogs/dog_darkcyan.png";
    case "dog_forestgreen":
      return "./assets/teams/dogs/dog_forestgreen.png";
    case "dog_green":
      return "./assets/teams/dogs/dog_green.png";
    case "dog_navyblue":
      return "./assets/teams/dogs/dog_navyblue.png";
    case "dog_orange":
      return "./assets/teams/dogs/dog_orange.png";
    case "dog_purple":
      return "./assets/teams/dogs/dog_purple.png";
    case "dog_skyblue":
      return "./assets/teams/dogs/dog_skyblue.png";
    case "dog_tomato":
      return "./assets/teams/dogs/dog_tomato.png";
    case "dog_yellow":
      return "./assets/teams/dogs/dog_yellow.png";
    case "duck_colorless":
      return "./assets/teams/ducks/duck_colorless.png";
    case "duck_darkcyan":
      return "./assets/teams/ducks/duck_darkcyan.png";
    case "duck_forestgreen":
      return "./assets/teams/ducks/duck_forestgreen.png";
    case "duck_green":
      return "./assets/teams/ducks/duck_green.png";
    case "duck_grey":
      return "./assets/teams/ducks/duck_grey.png";
    case "duck_navyblue":
      return "./assets/teams/ducks/duck_navyblue.png";
    case "duck_orange":
      return "./assets/teams/ducks/duck_orange.png";
    case "duck_pink":
      return "./assets/teams/ducks/duck_pink.png";
    case "duck_purple":
      return "./assets/teams/ducks/duck_purple.png";
    case "duck_skyblue":
      return "./assets/teams/ducks/duck_skyblue.png";
    case "duck_tomato":
      return "./assets/teams/ducks/duck_tomato.png";
    case "duck_yellow":
      return "./assets/teams/ducks/duck_yellow.png";
    case "eagle_colorless":
      return "./assets/teams/eagles/eagle_colorless.png";
    case "eagle_darkcyan":
      return "./assets/teams/eagles/eagle_darkcyan.png";
    case "eagle_forestgreen":
      return "./assets/teams/eagles/eagle_forestgreen.png";
    case "eagle_green":
      return "./assets/teams/eagles/eagle_green.png";
    case "eagle_grey":
      return "./assets/teams/eagles/eagle_grey.png";
    case "eagle_navyblue":
      return "./assets/teams/eagles/eagle_navyblue.png";
    case "eagle_orange":
      return "./assets/teams/eagles/eagle_orange.png";
    case "eagle_pink":
      return "./assets/teams/eagles/eagle_pink.png";
    case "eagle_purple":
      return "./assets/teams/eagles/eagle_purple.png";
    case "eagle_skyblue":
      return "./assets/teams/eagles/eagle_skyblue.png";
    case "eagle_tomato":
      return "./assets/teams/eagles/eagle_tomato.png";
    case "eagle_yellow":
      return "./assets/teams/eagles/eagle_yellow.png";
    case "elephant_colorless":
      return "./assets/teams/elephant/elephant_colorless.png";
    case "elephant_darkcyan":
      return "./assets/teams/elephant/elephant_darkcyan.png";
    case "elephant_forestgreen":
      return "./assets/teams/elephant/elephant_forestgreen.png";
    case "elephant_green":
      return "./assets/teams/elephant/elephant_green.png";
    case "elephant_grey":
      return "./assets/teams/elephant/elephant_grey.png";
    case "elephant_navyblue":
      return "./assets/teams/elephant/elephant_navyblue.png";
    case "elephant_orange":
      return "./assets/teams/elephant/elephant_orange.png";
    case "elephant_pink":
      return "./assets/teams/elephant/elephant_pink.png";
    case "elephant_purple":
      return "./assets/teams/elephant/elephant_purple.png";
    case "elephant_skyblue":
      return "./assets/teams/elephant/elephant_skyblue.png";
    case "elephant_tomato":
      return "./assets/teams/elephant/elephant_tomato.png";
    case "elephant_yellow":
      return "./assets/teams/elephant/elephant_yellow.png";
    case "falcon_colorless":
      return "./assets/teams/falcons/falcon_colorless.png";
    case "falcon_darkcyan":
      return "./assets/teams/falcons/falcon_darkcyan.png";
    case "falcon_forestgreen":
      return "./assets/teams/falcons/falcon_forestgreen.png";
    case "falcon_green":
      return "./assets/teams/falcons/falcon_green.png";
    case "falcon_grey":
      return "./assets/teams/falcons/falcon_grey.png";
    case "falcon_navyblue":
      return "./assets/teams/falcons/falcon_navyblue.png";
    case "falcon_orange":
      return "./assets/teams/falcons/falcon_orange.png";
    case "falcon_pink":
      return "./assets/teams/falcons/falcon_pink.png";
    case "falcon_purple":
      return "./assets/teams/falcons/falcon_purple.png";
    case "falcon_skyblue":
      return "./assets/teams/falcons/falcon_skyblue.png";
    case "falcon_tomato":
      return "./assets/teams/falcons/falcon_tomato.png";
    case "falcon_yellow":
      return "./assets/teams/falcons/falcon_yellow.png";
    case "bird_colorless":
      return "./assets/teams/flaming_bird/bird_colorless.png";
    case "bird_darkcyan":
      return "./assets/teams/flaming_bird/bird_darkcyan.png";
    case "bird_forestgreen":
      return "./assets/teams/flaming_bird/bird_forestgreen.png";
    case "bird_green":
      return "./assets/teams/flaming_bird/bird_green.png";
    case "bird_grey":
      return "./assets/teams/flaming_bird/bird_grey.png";
    case "bird_navyblue":
      return "./assets/teams/flaming_bird/bird_navyblue.png";
    case "bird_orange":
      return "./assets/teams/flaming_bird/bird_orange.png";
    case "bird_pink":
      return "./assets/teams/flaming_bird/bird_pink.png";
    case "bird_purple":
      return "./assets/teams/flaming_bird/bird_purple.png";
    case "bird_skyblue":
      return "./assets/teams/flaming_bird/bird_skyblue.png";
    case "bird_tomato":
      return "./assets/teams/flaming_bird/bird_tomato.png";
    case "bird_yellow":
      return "./assets/teams/flaming_bird/bird_yellow.png";
    case "goat_colorless":
      return "./assets/teams/goats/goat_colorless.png";
    case "goat_darkcyan":
      return "./assets/teams/goats/goat_darkcyan.png";
    case "goat_forestgreen":
      return "./assets/teams/goats/goat_forestgreen.png";
    case "goat_green":
      return "./assets/teams/goats/goat_green.png";
    case "goat_grey":
      return "./assets/teams/goats/goat_grey.png";
    case "goat_navyblue":
      return "./assets/teams/goats/goat_navyblue.png";
    case "goat_orange":
      return "./assets/teams/goats/goat_orange.png";
    case "goat_pink":
      return "./assets/teams/goats/goat_pink.png";
    case "goat_purple":
      return "./assets/teams/goats/goat_purple.png";
    case "goat_skyblue":
      return "./assets/teams/goats/goat_skyblue.png";
    case "goat_tomato":
      return "./assets/teams/goats/goat_tomato.png";
    case "goat_yellow":
      return "./assets/teams/goats/goat_yellow.png";
    case "gorilla_colorless":
      return "./assets/teams/gorillas/gorilla_colorless.png";
    case "gorilla_darkcyan":
      return "./assets/teams/gorillas/gorilla_darkcyan.png";
    case "gorilla_forestgreen":
      return "./assets/teams/gorillas/gorilla_forestgreen.png";
    case "gorilla_green":
      return "./assets/teams/gorillas/gorilla_green.png";
    case "gorilla_grey":
      return "./assets/teams/gorillas/gorilla_grey.png";
    case "gorilla_navyblue":
      return "./assets/teams/gorillas/gorilla_navyblue.png";
    case "gorilla_orange":
      return "./assets/teams/gorillas/gorilla_orange.png";
    case "gorilla_pink":
      return "./assets/teams/gorillas/gorilla_pink.png";
    case "gorilla_purple":
      return "./assets/teams/gorillas/gorilla_purple.png";
    case "gorilla_skyblue":
      return "./assets/teams/gorillas/gorilla_skyblue.png";
    case "gorilla_tomato":
      return "./assets/teams/gorillas/gorilla_tomato.png";
    case "gorilla_yellow":
      return "./assets/teams/gorillas/gorilla_yellow.png";
    case "grin_bear_colorless":
      return "./assets/teams/grin_bears/grin_bear_colorless.png";
    case "grin_bear_darkcyan":
      return "./assets/teams/grin_bears/grin_bear_darkcyan.png";
    case "grin_bear_forestgreen":
      return "./assets/teams/grin_bears/grin_bear_forestgreen.png";
    case "grin_bear_green":
      return "./assets/teams/grin_bears/grin_bear_green.png";
    case "grin_bear_grey":
      return "./assets/teams/grin_bears/grin_bear_grey.png";
    case "grin_bear_navyblue":
      return "./assets/teams/grin_bears/grin_bear_navyblue.png";
    case "grin_bear_orange":
      return "./assets/teams/grin_bears/grin_bear_orange.png";
    case "grin_bear_pink":
      return "./assets/teams/grin_bears/grin_bear_pink.png";
    case "grin_bear_purple":
      return "./assets/teams/grin_bears/grin_bear_purple.png";
    case "grin_bear_skyblue":
      return "./assets/teams/grin_bears/grin_bear_skyblue.png";
    case "grin_bear_tomato":
      return "./assets/teams/grin_bears/grin_bear_tomato.png";
    case "grin_bear_yellow":
      return "./assets/teams/grin_bears/grin_bear_yellow.png";
    case "grizzly_bear_colorless":
      return "./assets/teams/grizzly_bears/grizzly_bear_colorless.png";
    case "grizzly_bear_darkcyan":
      return "./assets/teams/grizzly_bears/grizzly_bear_darkcyan.png";
    case "grizzly_bear_forestgreen":
      return "./assets/teams/grizzly_bears/grizzly_bear_forestgreen.png";
    case "grizzly_bear_green":
      return "./assets/teams/grizzly_bears/grizzly_bear_green.png";
    case "grizzly_bear_grey":
      return "./assets/teams/grizzly_bears/grizzly_bear_grey.png";
    case "grizzly_bear_navyblue":
      return "./assets/teams/grizzly_bears/grizzly_bear_navyblue.png";
    case "grizzly_bear_orange":
      return "./assets/teams/grizzly_bears/grizzly_bear_orange.png";
    case "grizzly_bear_pink":
      return "./assets/teams/grizzly_bears/grizzly_bear_pink.png";
    case "grizzly_bear_purple":
      return "./assets/teams/grizzly_bears/grizzly_bear_purple.png";
    case "grizzly_bear_skyblue":
      return "./assets/teams/grizzly_bears/grizzly_bear_skyblue.png";
    case "grizzly_bear_tomato":
      return "./assets/teams/grizzly_bears/grizzly_bear_tomato.png";
    case "grizzly_bear_yellow":
      return "./assets/teams/grizzly_bears/grizzly_bear_yellow.png";
    case "himalayan_tiger_colorless":
      return "./assets/teams/himalayan_tigers/himalayan_tiger_colorless.png";
    case "himalayan_tiger_darkcyan":
      return "./assets/teams/himalayan_tigers/himalayan_tiger_darkcyan.png";
    case "himalayan_tiger_forestgreen":
      return "./assets/teams/himalayan_tigers/himalayan_tiger_forestgreen.png";
    case "himalayan_tiger_green":
      return "./assets/teams/himalayan_tigers/himalayan_tiger_green.png";
    case "himalayan_tiger_grey":
      return "./assets/teams/himalayan_tigers/himalayan_tiger_grey.png";
    case "himalayan_tiger_navyblue":
      return "./assets/teams/himalayan_tigers/himalayan_tiger_navyblue.png";
    case "himalayan_tiger_orange":
      return "./assets/teams/himalayan_tigers/himalayan_tiger_orange.png";
    case "himalayan_tiger_pink":
      return "./assets/teams/himalayan_tigers/himalayan_tiger_pink.png";
    case "himalayan_tiger_purple":
      return "./assets/teams/himalayan_tigers/himalayan_tiger_purple.png";
    case "himalayan_tiger_skyblue":
      return "./assets/teams/himalayan_tigers/himalayan_tiger_skyblue.png";
    case "himalayan_tiger_tomato":
      return "./assets/teams/himalayan_tigers/himalayan_tiger_tomato.png";
    case "himalayan_tiger_yellow":
      return "./assets/teams/himalayan_tigers/himalayan_tiger_yellow.png";
    case "horse_colorless":
      return "./assets/teams/horses/horse_colorless.png";
    case "horse_darkcyan":
      return "./assets/teams/horses/horse_darkcyan.png";
    case "horse_forestgreen":
      return "./assets/teams/horses/horse_forestgreen.png";
    case "horse_green":
      return "./assets/teams/horses/horse_green.png";
    case "horse_grey":
      return "./assets/teams/horses/horse_grey.png";
    case "horse_navyblue":
      return "./assets/teams/horses/horse_navyblue.png";
    case "horse_orange":
      return "./assets/teams/horses/horse_orange.png";
    case "horse_pink":
      return "./assets/teams/horses/horse_pink.png";
    case "horse_purple":
      return "./assets/teams/horses/horse_purple.png";
    case "horse_skyblue":
      return "./assets/teams/horses/horse_skyblue.png";
    case "horse_tomato":
      return "./assets/teams/horses/horse_tomato.png";
    case "horse_yellow":
      return "./assets/teams/horses/horse_yellow.png";
    case "lion_colorless":
      return "./assets/teams/lions/lion_colorless.png";
    case "lion_darkcyan":
      return "./assets/teams/lions/lion_darkcyan.png";
    case "lion_forestgreen":
      return "./assets/teams/lions/lion_forestgreen.png";
    case "lion_green":
      return "./assets/teams/lions/lion_green.png";
    case "lion_grey":
      return "./assets/teams/lions/lion_grey.png";
    case "lion_navyblue":
      return "./assets/teams/lions/lion_navyblue.png";
    case "lion_orange":
      return "./assets/teams/lions/lion_orange.png";
    case "lion_pink":
      return "./assets/teams/lions/lion_pink.png";
    case "lion_purple":
      return "./assets/teams/lions/lion_purple.png";
    case "lion_skyblue":
      return "./assets/teams/lions/lion_skyblue.png";
    case "lion_tomato":
      return "./assets/teams/lions/lion_tomato.png";
    case "lion_yellow":
      return "./assets/teams/lions/lion_yellow.png";
    case "owl_colorless":
      return "./assets/teams/owls/owl_colorless.png";
    case "owl_darkcyan":
      return "./assets/teams/owls/owl_darkcyan.png";
    case "owl_forestgreen":
      return "./assets/teams/owls/owl_forestgreen.png";
    case "owl_green":
      return "./assets/teams/owls/owl_green.png";
    case "owl_navyblue":
      return "./assets/teams/owls/owl_navyblue.png";
    case "owl_orange":
      return "./assets/teams/owls/owl_orange.png";
    case "owl_purple":
      return "./assets/teams/owls/owl_purple.png";
    case "owl_skyblue":
      return "./assets/teams/owls/owl_skyblue.png";
    case "owl_tomato":
      return "./assets/teams/owls/owl_tomato.png";
    case "owl_yellow":
      return "./assets/teams/owls/owl_yellow.png";
    case "panda_colorless":
      return "./assets/teams/pandas/panda_colorless.png";
    case "panda_darkcyan":
      return "./assets/teams/pandas/panda_darkcyan.png";
    case "panda_forestgreen":
      return "./assets/teams/pandas/panda_forestgreen.png";
    case "panda_green":
      return "./assets/teams/pandas/panda_green.png";
    case "panda_grey":
      return "./assets/teams/pandas/panda_grey.png";
    case "panda_navyblue":
      return "./assets/teams/pandas/panda_navyblue.png";
    case "panda_orange":
      return "./assets/teams/pandas/panda_orange.png";
    case "panda_pink":
      return "./assets/teams/pandas/panda_pink.png";
    case "panda_purple":
      return "./assets/teams/pandas/panda_purple.png";
    case "panda_skyblue":
      return "./assets/teams/pandas/panda_skyblue.png";
    case "panda_tomato":
      return "./assets/teams/pandas/panda_tomato.png";
    case "panda_yellow":
      return "./assets/teams/pandas/panda_yellow.png";
    case "python_colorless":
      return "./assets/teams/pythons/python_colorless.png";
    case "python_darkcyan":
      return "./assets/teams/pythons/python_darkcyan.png";
    case "python_forestgreen":
      return "./assets/teams/pythons/python_forestgreen.png";
    case "python_green":
      return "./assets/teams/pythons/python_green.png";
    case "python_grey":
      return "./assets/teams/pythons/python_grey.png";
    case "python_navyblue":
      return "./assets/teams/pythons/python_navyblue.png";
    case "python_orange":
      return "./assets/teams/pythons/python_orange.png";
    case "python_pink":
      return "./assets/teams/pythons/python_pink.png";
    case "python_purple":
      return "./assets/teams/pythons/python_purple.png";
    case "python_skyblue":
      return "./assets/teams/pythons/python_skyblue.png";
    case "python_tomato":
      return "./assets/teams/pythons/python_tomato.png";
    case "python_yellow":
      return "./assets/teams/pythons/python_yellow.png";
    case "reccoon_colorless":
      return "./assets/teams/raccoons/reccoon_colorless.png";
    case "reccoon_darkcyan":
      return "./assets/teams/raccoons/reccoon_darkcyan.png";
    case "reccoon_forestgreen":
      return "./assets/teams/raccoons/reccoon_forestgreen.png";
    case "reccoon_green":
      return "./assets/teams/raccoons/reccoon_green.png";
    case "reccoon_grey":
      return "./assets/teams/raccoons/reccoon_grey.png";
    case "reccoon_navyblue":
      return "./assets/teams/raccoons/reccoon_navyblue.png";
    case "reccoon_orange":
      return "./assets/teams/raccoons/reccoon_orange.png";
    case "reccoon_pink":
      return "./assets/teams/raccoons/reccoon_pink.png";
    case "reccoon_purple":
      return "./assets/teams/raccoons/reccoon_purple.png";
    case "reccoon_skyblue":
      return "./assets/teams/raccoons/reccoon_skyblue.png";
    case "reccoon_tomato":
      return "./assets/teams/raccoons/reccoon_tomato.png";
    case "reccoon_yellow":
      return "./assets/teams/raccoons/reccoon_yellow.png";
    case "rat_colorless":
      return "./assets/teams/rats/rat_colorless.png";
    case "rat_darkcyan":
      return "./assets/teams/rats/rat_darkcyan.png";
    case "rat_forestgreen":
      return "./assets/teams/rats/rat_forestgreen.png";
    case "rat_green":
      return "./assets/teams/rats/rat_green.png";
    case "rat_navyblue":
      return "./assets/teams/rats/rat_navyblue.png";
    case "rat_orange":
      return "./assets/teams/rats/rat_orange.png";
    case "rat_purple":
      return "./assets/teams/rats/rat_purple.png";
    case "rat_skyblue":
      return "./assets/teams/rats/rat_skyblue.png";
    case "rat_tomato":
      return "./assets/teams/rats/rat_tomato.png";
    case "rat_yellow":
      return "./assets/teams/rats/rat_yellow.png";
    case "rhino_colorless":
      return "./assets/teams/rhino/rhino_colorless.png";
    case "rhino_darkcyan":
      return "./assets/teams/rhino/rhino_darkcyan.png";
    case "rhino_forestgreen":
      return "./assets/teams/rhino/rhino_forestgreen.png";
    case "rhino_green":
      return "./assets/teams/rhino/rhino_green.png";
    case "rhino_grey":
      return "./assets/teams/rhino/rhino_grey.png";
    case "rhino_navyblue":
      return "./assets/teams/rhino/rhino_navyblue.png";
    case "rhino_orange":
      return "./assets/teams/rhino/rhino_orange.png";
    case "rhino_pink":
      return "./assets/teams/rhino/rhino_pink.png";
    case "rhino_purple":
      return "./assets/teams/rhino/rhino_purple.png";
    case "rhino_skyblue":
      return "./assets/teams/rhino/rhino_skyblue.png";
    case "rhino_tomato":
      return "./assets/teams/rhino/rhino_tomato.png";
    case "rhino_yellow":
      return "./assets/teams/rhino/rhino_yellow.png";
    case "rooster_colorless":
      return "./assets/teams/roosters/rooster_colorless.png";
    case "rooster_darkcyan":
      return "./assets/teams/roosters/rooster_darkcyan.png";
    case "rooster_forestgreen":
      return "./assets/teams/roosters/rooster_forestgreen.png";
    case "rooster_green":
      return "./assets/teams/roosters/rooster_green.png";
    case "rooster_grey":
      return "./assets/teams/roosters/rooster_grey.png";
    case "rooster_navyblue":
      return "./assets/teams/roosters/rooster_navyblue.png";
    case "rooster_orange":
      return "./assets/teams/roosters/rooster_orange.png";
    case "rooster_pink":
      return "./assets/teams/roosters/rooster_pink.png";
    case "rooster_purple":
      return "./assets/teams/roosters/rooster_purple.png";
    case "rooster_skyblue":
      return "./assets/teams/roosters/rooster_skyblue.png";
    case "rooster_tomato":
      return "./assets/teams/roosters/rooster_tomato.png";
    case "rooster_yellow":
      return "./assets/teams/roosters/rooster_yellow.png";
    case "shark_colorless":
      return "./assets/teams/sharks/shark_colorless.png";
    case "shark_darkcyan":
      return "./assets/teams/sharks/shark_darkcyan.png";
    case "shark_forestgreen":
      return "./assets/teams/sharks/shark_forestgreen.png";
    case "shark_green":
      return "./assets/teams/sharks/shark_green.png";
    case "shark_grey":
      return "./assets/teams/sharks/shark_grey.png";
    case "shark_navyblue":
      return "./assets/teams/sharks/shark_navyblue.png";
    case "shark_orange":
      return "./assets/teams/sharks/shark_orange.png";
    case "shark_pink":
      return "./assets/teams/sharks/shark_pink.png";
    case "shark_purple":
      return "./assets/teams/sharks/shark_purple.png";
    case "shark_skyblue":
      return "./assets/teams/sharks/shark_skyblue.png";
    case "shark_tomato":
      return "./assets/teams/sharks/shark_tomato.png";
    case "shark_yellow":
      return "./assets/teams/sharks/shark_yellow.png";
    case "snack_colorless":
      return "./assets/teams/snacks/snack_colorless.png";
    case "snack_darkcyan":
      return "./assets/teams/snacks/snack_darkcyan.png";
    case "snack_forestgreen":
      return "./assets/teams/snacks/snack_forestgreen.png";
    case "snack_green":
      return "./assets/teams/snacks/snack_green.png";
    case "snack_grey":
      return "./assets/teams/snacks/snack_grey.png";
    case "snack_navyblue":
      return "./assets/teams/snacks/snack_navyblue.png";
    case "snack_orange":
      return "./assets/teams/snacks/snack_orange.png";
    case "snack_pink":
      return "./assets/teams/snacks/snack_pink.png";
    case "snack_purple":
      return "./assets/teams/snacks/snack_purple.png";
    case "snack_skyblue":
      return "./assets/teams/snacks/snack_skyblue.png";
    case "snack_tomato":
      return "./assets/teams/snacks/snack_tomato.png";
    case "snack_yellow":
      return "./assets/teams/snacks/snack_yellow.png";
    case "tiger_colorless":
      return "./assets/teams/tiger/tiger_colorless.png";
    case "tiger_darkcyan":
      return "./assets/teams/tiger/tiger_darkcyan.png";
    case "tiger_forestgreen":
      return "./assets/teams/tiger/tiger_forestgreen.png";
    case "tiger_green":
      return "./assets/teams/tiger/tiger_green.png";
    case "tiger_grey":
      return "./assets/teams/tiger/tiger_grey.png";
    case "tiger_navyblue":
      return "./assets/teams/tiger/tiger_navyblue.png";
    case "tiger_orange":
      return "./assets/teams/tiger/tiger_orange.png";
    case "tiger_pink":
      return "./assets/teams/tiger/tiger_pink.png";
    case "tiger_purple":
      return "./assets/teams/tiger/tiger_purple.png";
    case "tiger_skyblue":
      return "./assets/teams/tiger/tiger_skyblue.png";
    case "tiger_tomato":
      return "./assets/teams/tiger/tiger_tomato.png";
    case "tiger_yellow":
      return "./assets/teams/tiger/tiger_yellow.png";
    case "white_wolve_colorless":
      return "./assets/teams/white_wolves/white_wolve_colorless.png";
    case "white_wolve_darkcyan":
      return "./assets/teams/white_wolves/white_wolve_darkcyan.png";
    case "white_wolve_forestgreen":
      return "./assets/teams/white_wolves/white_wolve_forestgreen.png";
    case "white_wolve_green":
      return "./assets/teams/white_wolves/white_wolve_green.png";
    case "white_wolve_grey":
      return "./assets/teams/white_wolves/white_wolve_grey.png";
    case "white_wolve_navyblue":
      return "./assets/teams/white_wolves/white_wolve_navyblue.png";
    case "white_wolve_orange":
      return "./assets/teams/white_wolves/white_wolve_orange.png";
    case "white_wolve_pink":
      return "./assets/teams/white_wolves/white_wolve_pink.png";
    case "white_wolve_purple":
      return "./assets/teams/white_wolves/white_wolve_purple.png";
    case "white_wolve_skyblue":
      return "./assets/teams/white_wolves/white_wolve_skyblue.png";
    case "white_wolve_tomato":
      return "./assets/teams/white_wolves/white_wolve_tomato.png";
    case "white_wolve_yellow":
      return "./assets/teams/white_wolves/white_wolve_yellow.png";
    case "wolf_cat_colorless":
      return "./assets/teams/wolf_cats/wolf_cat_colorless.png";
    case "wolf_cat_darkcyan":
      return "./assets/teams/wolf_cats/wolf_cat_darkcyan.png";
    case "wolf_cat_forestgreen":
      return "./assets/teams/wolf_cats/wolf_cat_forestgreen.png";
    case "wolf_cat_green":
      return "./assets/teams/wolf_cats/wolf_cat_green.png";
    case "wolf_cat_grey":
      return "./assets/teams/wolf_cats/wolf_cat_grey.png";
    case "wolf_cat_navyblue":
      return "./assets/teams/wolf_cats/wolf_cat_navyblue.png";
    case "wolf_cat_orange":
      return "./assets/teams/wolf_cats/wolf_cat_orange.png";
    case "wolf_cat_pink":
      return "./assets/teams/wolf_cats/wolf_cat_pink.png";
    case "wolf_cat_purple":
      return "./assets/teams/wolf_cats/wolf_cat_purple.png";
    case "wolf_cat_skyblue":
      return "./assets/teams/wolf_cats/wolf_cat_skyblue.png";
    case "wolf_cat_tomato":
      return "./assets/teams/wolf_cats/wolf_cat_tomato.png";
    case "wolf_cat_yellow":
      return "./assets/teams/wolf_cats/wolf_cat_yellow.png";
    default:
      return "./assets/logoOwl.png";
  }
};
