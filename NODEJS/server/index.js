const PORT = 8888;
const low = require("lowdb");
const axios = require("axios");
const FileSync = require("lowdb/adapters/FileSync");
const adapterdb = new FileSync("./db.json");
const db = low(adapterdb);
const adapterDataStorage = new FileSync("./dataStorage.json");
var dataStorage = low(adapterDataStorage);

// Doc LOWDB
db.defaults({ data: [] }).write();
dataStorage.defaults({ data: {} }).write();

let path = require("path");
let express = require("express");
let ip = require("ip");
let app = express();
app.use(express.static(path.resolve("../client")));
let bodyparser = require("body-parser");

let server = require("http").Server(app);                   //#Khởi tạo một chương trình mạng (app)
let io = require("socket.io")(server);                      //#Phải khởi tạo io sau khi tạo app!

// Mo PORT 8888 o dia chi IP cua may
server.listen(PORT, async function () {
    console.log("Server Nodejs chay tai dia chi: " + ip.address() + ":" + PORT);
});

app.get("/", function (req, res) {
    res.sendfile(path.resolve("../client/index.html"));
});

app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());

// Bien luu che do Manual
let manualStatus = dataStorage.get("manual").value();
// Bien luu che do System
let systemStatus = dataStorage.get("systemStatus").value();

let inside = { temp: 0, lux: 0 };

//Get data Inside
function getDataInside(vtemp, vlux, vtime) {
    console.log("Get data inside");

    inside.temp = vtemp;
    inside.lux = vlux;
    return 0;
}

// Get data Outside
async function getDataOutside(vtemp, vlux, vposServo, vtime) {
    console.log("Get data outside");
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


    // Neu o che do Auto, goi API den Flask Server de lay goc quay tu ML
    if(!manualStatus){
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
                    if (checkSchedule()) {
                        io.sockets.emit("setServo", parseInt(servoDegree));
                    }
                    else {
                        console.log("Khong phai ngay lam viec");
                    }
                } else {
                    console.log("He thong dang tat");
                }
            })
            .catch(function (error) {
                console.log("Co loi!!! Can't call API Flask Server");
            })
            .then(function () { });
    }

    // Gui du lieu ve phia client de hien thi
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

// Kiem tra phan lap lich
function checkSchedule() {
    let dateOb = new Date()
    currentDayOfWeek = dateOb.getDay()
    // 0 la thu 2, 1 la thu 3, 2 la thu 4, 3 la thu 5, 4 la thu 6, 5 la thu 7, 6 la chu nhat
    currentDayOfWeek = currentDayOfWeek == 0 ? 6 : currentDayOfWeek - 1;
    currentTime = dateOb.getHours()
    let scheduleOfDay = dataStorage.get("data").value()
    scheduleOfDay = Object.values(scheduleOfDay);
    if (currentTime < 12) {
        if (scheduleOfDay[currentDayOfWeek * 2]) {
            scheduleStatus = true;
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

// Lang nghe cac goi tin bang SocketIO
io.on("connection", function (socket) {

    socket.on("FirstConnect", function (message) {
        console.log(message);
    });

    socket.on("Connect", function (message) {
        console.log(message);
    });

    // Get data de hien thi phia client
    socket.on("requestData", function (check) {
        if (check) {
            let data = db.get("data").value();
            data = data.slice(data.length - 3);

            socket.emit("sendData", data);
        }
    });

    // Gui data den ESP de quay goc. POST len API phia Flask Server de luu trang trai (Hoc thoi quen nguoi dung)
    socket.on("postDataServo", function (pos) {
        pos = parseInt(pos);
        previousData = db.get("data").value();
        previousData = previousData[previousData.length-1];
        axios({
            method: "post",
            url: "http://127.0.0.1:9999",
            headers: {},
            data: {
                timeStamp: previousData.TimeStamp,
                insideTemp: previousData.InsideTemp,
                insideLux: previousData.InsideLux,
                outsideTemp: previousData.OutsideLux,
                outsideLux: previousData.OutsideTemp,
                ismanual: "1",
                servoDegree: pos,
            },
        })
            .then(function (response) {
            })
            .catch(function (error) {
                console.log("Co loi!!! Can't call API Flask Server");
            })
            .then(function () { 
                console.log("Da post data len API")
            });

        if (systemStatus) {
            io.sockets.emit("setServo", pos);
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

    // Kiem tra khi co loi khong doc duoc o cac cam bien
    socket.on("CheckOutside", function (message) {
        console.log(message);
    });

    socket.on("CheckInside", function (message) {
        console.log(message);
    });

    // Thong bao sau khi quay xong
    socket.on("servoDone", function (message) {
        console.log(message);
    });

    // Thiet lap trang thai cho cac bien he thong
    socket.on("changeDataSchedule", (data) => {
        dataStorage.set("data", data).write();
    });

    socket.on("requestScheduleData", (check) => {
        if (check) {
            const dataSchedule = dataStorage.get("data").value();
            socket.emit("sendScheduleData", dataSchedule);
        }
    });
    socket.on("requestSystemStatus", (check) => {
        if (check) {
            systemStatus = dataStorage.get("systemStatus").value();
            socket.emit("systemStatus", systemStatus);
        }
    });
    socket.on("changeSystemStatus", (isSystemStatus) => {
        systemStatus = isSystemStatus;
        dataStorage.set("systemStatus", isSystemStatus).write();
    });
    socket.on("requestIsManual", (check) => {
        if (check) {
            manualStatus = dataStorage.get("manual").value();
            socket.emit("isManual", manualStatus);
        }
    });
    socket.on("changeManual", (isManual) => {
        manualStatus = isManual;
        dataStorage.set("manual", isManual).write();
    });
});


