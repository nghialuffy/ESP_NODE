const storageKey = "schedule";

let socket = io();
let list = [];
let listString = "";
let scheduleString = "";

const htmlList = document.getElementById("history");
const scheduleTable = document.getElementById("schedule-table");
const btnSwitchSystem = document.getElementById("btn-switch-system");

let schedule = {};

function convertToHTML(list) {
  const content = list.map(function (item) {
    return `
    <div class="item">
      <div class="item-content">Time: ${item.TimeStamp}</div>
      <div class="item-content">Outside:</div>
      <div class="item-content-small">Lux: ${item.OutsideLux}</div>
      <div class="item-content-small">Temp: ${item.OutsideTemp}</div>
      <div class="item-content">Inside:</div>
      <div class="item-content-small">Lux: ${item.InsideLux}</div>
      <div class="item-content-small">Temp: ${item.InsideTemp}</div>
      <div class="item-content">Servo: ${item.Servo}</div>
    </div>`;
  });
  return content;
}
function statusHTML(item) {
  return `
  <div class="item">
    <div class="item-content">Time: ${item.TimeStamp}</div>
    <div class="item-content">Outside:</div>
    <div class="item-content-small">Lux: ${item.OutsideLux}</div>
    <div class="item-content-small">Temp: ${item.OutsideTemp}</div>
    <div class="item-content">Inside:</div>
    <div class="item-content-small">Lux: ${item.InsideLux}</div>
    <div class="item-content-small">Temp: ${item.InsideTemp}</div>
  </div>`;
}
function render() {
  const content = convertToHTML(list);
  htmlList.innerHTML = content.join("");
  renderSchedule();
}

function renderSchedule() {
  console.log("Rendering schedule...");
  for (const key in schedule) {
    if (schedule[key] == true) {
      document.getElementById(key).classList.add("bg-green");
    }
  }
}
//render();

$("#arc-slider").roundSlider({
  sliderType: "min-range",
  circleShape: "custom-quarter",
  value: 0,
  min: 0,
  max: 180,
  startAngle: 45,
  editableTooltip: true,
  radius: 240,
  width: 6,
  handleSize: "+32",
  tooltipFormat: function (args) {
    return args.value + "&#176;";
  },
});
let btnSubmit = document.getElementById("btn-submit");
btnSubmit.addEventListener("click", () => {
  let servoString = document
    .getElementsByClassName("edit")[0]
    .textContent.replace("°", "");
  console.log(servoString);
  socket.emit("postDataServo", servoString);
});

$(function () {
  $(".set-servo-manual").hide();
  $("#set-mode").change(function () {
    if ($(this).prop("checked")) $(".set-servo-manual").hide();
    else $(".set-servo-manual").show();
  });
});

$(function () {
  $("td").click(function () {
    if ($(this).hasClass("bg-green")) {
      $(this).removeClass("bg-green");
    } else $(this).addClass("bg-green");
  });
});

scheduleTable.addEventListener("click", (event) => {
  const elementId = event.target.id;
  for (const key in schedule) {
    if (key == elementId) {
      schedule[key] = !schedule[key];
    }
  }
  socket.emit("changeDataSchedule", schedule);
});

socket.on("sendDataOutside", (data) => {
  list.unshift(data);

  if (list.length > 3) list.pop();

  document.getElementById("info-status").innerHTML = statusHTML(data);
  render();
});

socket.emit("requestScheduleData", true);
socket.on("sendScheduleData", (data) => {
  schedule = data;
});

async function loadData() {
  console.log("Loading data...");
  socket.emit("requestData", true);
  socket.on("sendData", (data) => {
    list = data;

    htmlList.innerHTML = convertToHTML(list);
    document.getElementById("info-status").innerHTML = statusHTML(
      list[list.length - 1]
    );
    render();
  });
}

let systemStatus = btnSwitchSystem.checked;

btnSwitchSystem.onchange = () => {
  systemStatus = !systemStatus;
  console.log(systemStatus);
  socket.emit("changeSystemStatus", systemStatus)
}
