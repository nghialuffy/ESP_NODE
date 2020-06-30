const storageKey = "schedule";

let socket = io();
let list = [];
let listString = "";
let scheduleString = "";


const htmlList = document.getElementById("history");
const scheduleTable = document.getElementById("schedule-table");
const btnSwitchSystem = document.getElementById("btn-switch-system");
const sectionSetMode = document.getElementById("section-set-mode");
const sectionSchedule = document.getElementById("section-schedule");
const sectionSetServo = document.getElementById("section-set-servo");
const btnRadios = document.getElementsByClassName("radio-btn");
const btnSetMode = document.getElementById("set-mode");

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


let btnSubmit = document.getElementById("btn-submit");
btnSubmit.addEventListener("click", () => {
  let servoString;
  for(let i=0; i<btnRadios.length;i++){
    if (btnRadios[i].checked) {
      servoString = btnRadios[i].id;
    }
  }
  console.log(servoString);
  socket.emit("postDataServo", servoString);
});

$(function () {
  $(".set-servo-manual").hide();
  $("#set-mode").change(function () {
    if ($(this).prop("checked")) {
      $(".set-servo-manual").hide();
      $("#section-schedule").show();
    } else {
      $(".set-servo-manual").show();
      $("#section-schedule").hide();
    }
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
  socket.emit("requestIsManual", true);
  socket.on("isManual", check => {
    isManual = check;
    //console.log(isManual);
    if (isManual){
      $("#set-mode").bootstrapToggle("off");
    }
    else $("#set-mode").bootstrapToggle("on");
  })

  socket.emit("requestSystemStatus", true);
  socket.on("systemStatus", check => {
    systemStatus = check;
    //console.log(isManual);
    if (systemStatus){
      $("#btn-switch-system").bootstrapToggle("on");
    }
    else $("#btn-switch-system").bootstrapToggle("off");
  })
}

btnSwitchSystem.onchange = () => {
  systemStatus = btnSwitchSystem.checked;
  if (systemStatus === false) {
    console.log("change display mode");
    sectionSetMode.style.display = "none";
    sectionSchedule.style.display = "none";
    if (sectionSetServo.style.display !== "none"){
      sectionSetServo.style.display = "none";
    }
  } else {
    sectionSetMode.style.display = "block";
    if (btnSetMode.checked){
      sectionSchedule.style.display = "block";
    } else {
      sectionSetServo.style.display = "block";
    }
  }
  //console.log(systemStatus);
  socket.emit("changeSystemStatus", systemStatus);
};

btnSetMode.onchange = () => {
  let isManual = !(btnSetMode.checked);
  socket.emit("changeManual", isManual);
}

