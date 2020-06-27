const PORT = 8888;

const low = require("lowdb");
const axios = require("axios");
const FileSync = require("lowdb/adapters/FileSync");
const adapterdb = new FileSync("./db.json");
const db = low(adapterdb);
const adapterSchedule = new FileSync("./schedule.json");
let schedule = low(adapterSchedule);

// TURN ON/ OFF SYSTEM
let systemStatus = true
// TURN ON/ OFF SCHEDULE
let scheduleStatus = true
// TURN ON/ OFF AUTO/MANUAL
let ManualStatus = true

db.defaults({ data: [] }).write();

schedule.defaults({ data: {} }).write();

let path = require("path");
let express = require("express"); //Đặt địa chỉ Port được mở ra để tạo ra chương trình mạng Socket Server
let ip = require("ip");
let app = express();
app.use(express.static(path.resolve("../client")));
let bodyparser = require("body-parser");

let server = require("http").Server(app); //#Khởi tạo một chương trình mạng (app)
let io = require("socket.io")(server); //#Phải khởi tạo io sau khi tạo app!

server.listen(PORT, async function () {
    console.log("Server Nodejs chay tai dia chi: " + ip.address() + ":" + PORT);
});

app.get("/", function (req, res) {
    res.sendfile(path.resolve("../client/index.html"));
});

app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());

let inside = { temp: 0, lux: 0 };
let currentStatus = {
    TimeStamp: 0,
    InsideTemp: 0,
    InsideLux: 0,
    OutsideTemp: 0,
    OutsideLux: 0,
    Servo: 0,
};
function getDataInside(vtemp, vlux, vtime) {
    console.log("Get data inside");

    inside.temp = vtemp;
    inside.lux = vlux;
    return 0;
}

async function getDataOutside(vtemp, vlux, vposServo, vtime) {
    console.log("Get data outside");
    currentStatus.InsideLux = inside.lux;
    currentStatus.InsideTemp = inside.temp;
    currentStatus.OutsideLux = vlux;
    currentStatus.OutsideTemp = vtemp;
    currentStatus.TimeStamp = vtime;
    db.get("data")
        .push({
            TimeStamp: vtime,
            InsideTemp: inside.temp,
            InsideLux: inside.lux,
            OutsideTemp: vtemp,
            OutsideLux: vlux,
            Servo: vposServo,
        })
        .write();

    axios({
        method: "post",
        url: "http://127.0.0.1:9999",
        headers: {},
        data: {
            timeStamp: vtime,
            insideTemp: inside.temp,
            insideLux: inside.lux,
            outsideTemp: vtemp,
            outsideLux: vlux,
            ismanual: "0",
        },
    })
        .then(function (response) {
            servoDegree = response.data.servoDegree;

            if (systemStatus) {
                if (checkSchedule() || ManualStatus) {
                    io.sockets.emit("setServo", parseInt(servoDegree));
                }
            } else {
                console.log("He thong dang tat")
            }


        })
        .catch(function (error) {
            console.log("Co loi!!! Khong the qua Servo");
        })
        .then(function () { });

    io.sockets.emit("sendDataOutside", {
        TimeStamp: vtime,
        InsideTemp: inside.temp,
        InsideLux: inside.lux,
        OutsideTemp: vtemp,
        OutsideLux: vlux,
        Servo: vposServo,
    });
    return 1;
}

function checkSchedule() {
    let dateOb = new Date()
    currentDayOfWeek = dateOb.getDay()
    // 0 la thu 2, 1 la thu 3, 2 la thu 4, 3 la thu 5, 4 la thu 6, 5 la thu 7, 6 la chu nhat
    currentDayOfWeek = currentDayOfWeek == 0 ? 6 : currentDayOfWeek - 1;
    currentTime = dateOb.getHours()
    let scheduleOfDay = schedule.get("data").value()
    scheduleOfDay = Object.values(scheduleOfDay);
    if (currentTime < 12) {
        if (scheduleOfDay[currentDayOfWeek * 2]) {
            scheduleStatus = true;
            // console.log(scheduleStatus+"AM")
            return true;
        }
    }
    else {
        if (scheduleOfDay[currentDayOfWeek * 2 + 1]) {
            scheduleStatus = true;
            return true;
        }
    }
    scheduleStatus = false;
    return false
}

io.on("connection", function (socket) {
    socket.on("FirstConnect", function (message) {
        console.log(message);
    });

    socket.on("Connect", function (message) {
        console.log(message);
    });

    socket.on("requestData", function (check) {
        if (check) {
            let data = db.get("data").value();
            data = data.slice(data.length - 3);

            socket.emit("sendData", data);
        }
    });
    socket.on("postDataServo", function (pos) {
        pos = parseInt(pos);

        if (systemStatus) {
            if (checkSchedule() || ManualStatus) {
                io.sockets.emit("setServo", pos);
            }
        } else {
            console.log("He thong dang tat")
        }

    });

    socket.on("GetDataInside", async function (data) {
        let [temp, lux, time] = data.inside.split(",");
        res = await getDataInside(temp, lux, time);
    });

    socket.on("GetDataOutside", async function (data) {
        let [temp, lux, posServo, time] = data.outside.split(",");
        res = await getDataOutside(temp, lux, posServo, time);
    });

    socket.on("CheckOutside", function (message) {
        console.log(message);
    });

    socket.on("CheckInside", function (message) {
        console.log(message);
    });

    socket.on("servoDone", function (message) {
        console.log(message);
    });

    socket.on("changeDataSchedule", (data) => {
        schedule.set("data", data).write();
    });
    socket.on("requestScheduleData", (check) => {
        if (check) {
            const dataSchedule = schedule.get("data").value();
            socket.emit("sendScheduleData", dataSchedule);
        }
    });
    socket.on("changeSystemStatus", (systemStatus) => {
        console.log("System Status: ", systemStatus);
    })
});


