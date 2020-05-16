const PORT = 8888;	

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json')
const db = low(adapter)

db.defaults({ datainside: [], dataoutside: [], posServo: [] })
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


function timeToStr(objTime) {
    return objTime.hour + ":" + objTime.minute + " " + objTime.day + "/" + objTime.month + "/" + objTime.year;
}
function getDataInside(vtemp, vlux, vtime) {
    let objTime = { day: 0, month: 0, year: 0, hour: 0, minute: 0, second: 0 };
    objTime.day = parseInt(vtime.slice(0, 2));
    objTime.month = parseInt(vtime.slice(2, 4));
    objTime.year = parseInt(vtime.slice(4, 6));
    objTime.hour = parseInt(vtime.slice(7, 9));
    objTime.minute = parseInt(vtime.slice(9, 11));
    objTime.second = parseInt(vtime.slice(11, 13));

    db.get('datainside')
      .push({ 
                temp: vtemp, 
                lux: vlux,
                time: objTime
            })
      .write()

}

function getDataOutside(vtemp, vlux, vposServo, vtime) {
    let objTime = { day: 0, month: 0, year: 0, hour: 0, minute: 0, second: 0 };
    objTime.day = parseInt(vtime.slice(0, 2));
    objTime.month = parseInt(vtime.slice(2, 4));
    objTime.year = parseInt(vtime.slice(4, 6));
    objTime.hour = parseInt(vtime.slice(7, 9));
    objTime.minute = parseInt(vtime.slice(9, 11));
    objTime.second = parseInt(vtime.slice(11, 13));

    db.get('dataoutside')
      .push({ 
                temp: vtemp, 
                lux: vlux,
                time: objTime
            })
      .write();

    db.get('posServo')
      .push(
                vposServo
            )
      .write();

}

function setPosServo() {
    app.post('/', (req, res) => {
        // var servoString = req.getElementsByClassName("edit")[0].textContent.replace("°","");
        console.log(req.body);
        var pos = parseInt(req.body.value)
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