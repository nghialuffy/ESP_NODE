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



var inside = { temp: 0, lux : 0}

function getDataInside(vtemp, vlux, vtime) {
        console.log("Get data inside");
        inside.temp = vtemp;
        inside.lux = vlux;
    return 0
}

function getDataOutside(vtemp, vlux, vposServo, vtime) {
    console.log("Get data outside");
    db.get('data')
      .push({ 
                TimeStamp: vtime,
                InsideTemp: inside.temp, 
                InsideLux: inside.lux,
                OutsideTemp: vtemp,
                OutsideLux: vlux,
                Servo : vposServo,
            })
      .write();
      
    io.sockets.emit('sendDataOutside', {
                                            TimeStamp: vtime,
                                            InsideTemp: inside.temp, 
                                            InsideLux: inside.lux,
                                            OutsideTemp: vtemp,
                                            OutsideLux: vlux,
                                            Servo : vposServo
                                        });
    return 1
}

//Khi có một kết nối được tạo giữa Socket Client và Socket Server
io.on('connection', function (socket) {

    socket.on('Connect', function (message) {
        console.log(message);
    });

    socket.on('postDataServo', function(pos){
        var pos = parseInt(pos);
        io.sockets.emit('setServo', pos);
    });

    socket.on('GetDataInside', async function (data) {
        let [temp, lux, time] = data.inside.split(",");
        res = await getDataInside(temp, lux, time);
    });

    socket.on('GetDataOutside', async function (data) {

        let [temp, lux, posServo, time] = data.outside.split(",");
        res = await getDataOutside(temp, lux, posServo, time);
    });

    socket.on('CheckOutside', function (message) {
        console.log(message)
    });

    socket.on('CheckInside', function (message) {
        console.log(message)
    });

    socket.on('servoDone', function (message) {
        console.log(message);
    });
});
