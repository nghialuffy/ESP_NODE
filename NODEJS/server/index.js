const PORT = 8888;	

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json')
const db = low(adapter)

db.defaults({ data : [] })
  .write()

var path = require('path');
var express = require("express")							//Đặt địa chỉ Port được mở ra để tạo ra chương trình mạng Socket Server
var ip = require('ip');
var app = express();
app.use(express.static(path.resolve('../client')));
var bodyparser = require('body-parser');


var server = require('http').Server(app);         //#Khởi tạo một chương trình mạng (app)
var io = require('socket.io')(server);            //#Phải khởi tạo io sau khi tạo app!

server.listen(PORT, function () {
    console.log("Server Nodejs chay tai dia chi: " + ip.address() + ":" + PORT)
});


app.get('/', function (req, res) {
    res.sendfile(path.resolve('../client/index.html'));
});

app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());



var storageKey = 'list';

var inside = { temp: 0, lux : 0, time : ""}

function timeToStr(objTime) {
    return objTime.hour + ":" + objTime.minute + " " + objTime.day + "/" + objTime.month + "/" + objTime.year;
}

function getDataInside(vtemp, vlux, vtime) {
        inside.temp = vtemp;
        inside.lux = vlux;
        inside.time = vtime;
}

function getDataOutside(vtemp, vlux, vposServo, vtime) {

    db.get('data')
      .push({ 
                TimeStamp: inside.time,
                InsideTemp: inside.temp, 
                InsideLux: inside.lux,
                OutsideTemp: vtemp,
                OutsideLux: vlux,
                Servo : vposServo,
            })
      .write()

}

function setPosServo() {
    app.post('/', (req, res) => {
        var pos = parseInt(req.body['servo']);
        io.sockets.emit('setServo', pos);
    });
}

//Khi có một kết nối được tạo giữa Socket Client và Socket Server
io.on('connection', function (socket) {
    console.log("Connected"); //In ra màn hình console là đã có một Socket Client kết nối thành công.

    socket.on('Connect', function (message) {
        console.log(message);
    });

    socket.on('GetDataInside', function (data) {
        let [temp, lux, time] = data.inside.split(",");
        getDataInside(temp, lux, time);
        // console.log(data.inside)
    });

    socket.on('GetDataOutside', function (data) {
        setPosServo();
        let [temp, lux, posServo, time] = data.outside.split(",");
        getDataOutside(temp, lux, posServo, time);
        // console.log(data.inside)
    });


    socket.on('servoDone', function (message) {
        console.log(message);
    });



});