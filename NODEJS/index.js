const PORT = 8888;								//Đặt địa chỉ Port được mở ra để tạo ra chương trình mạng Socket Server
var ip = require('ip');
var app = require('express')();
var http = require('http').Server(app);         //#Khởi tạo một chương trình mạng (app)
var io = require('socket.io')(http);            //#Phải khởi tạo io sau khi tạo app!
var bodyparser = require('body-parser');

app.get('/', function (req, res) {
	res.sendfile('main.html');
});

app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());

http.listen(PORT, function () {
	console.log("Server Nodejs chay tai dia chi: " + ip.address() + ":" + PORT)
});


var datainside = [];
var dataoutside = [];

function getDataInside(temp, lux, time){
    let objTime = {day : 0, month : 0, year : 0, hour : 0, minute : 0, second : 0};
    let inside = {temp : 0, lux : 0 , time};
    inside.temp = temp;
    inside.lux = lux;
    objTime.day = parseInt(time.slice(0,2));
    objTime.month = parseInt(time.slice(2,4));
    objTime.year = parseInt(time.slice(4,6));
    objTime.hour = parseInt(time.slice(7,9));
    objTime.minute = parseInt(time.slice(9,11));
    objTime.second = parseInt(time.slice(11,13));
    inside.time = objTime;
    
    datainside.push(inside);
    // console.log(datainside);
    
}

function getDataOutside(temp, lux, posServo, time){
    let objTime = {day : 0, month : 0, year : 0, hour : 0, minute : 0, second : 0};
    let outside = {temp : 0, lux : 0 , posServo : 0, time};
    outside.temp = temp;
    outside.lux = lux;
    objTime.day = parseInt(time.slice(0,2));
    objTime.month = parseInt(time.slice(2,4));
    objTime.year = parseInt(time.slice(4,6));
    objTime.hour = parseInt(time.slice(7,9));
    objTime.minute = parseInt(time.slice(9,11));
    objTime.second = parseInt(time.slice(11,13));
    outside.posServo = posServo;
    outside.time = objTime;
    
    dataoutside.push(outside);
    // console.log(dataoutside);
    
}

function setPosServo() {
	app.post('/', (req, res)=>{
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
        let [temp,lux,time] = data.inside.split(",");
        getDataInside(temp,lux,time);
        // console.log(data.inside)
    });

    socket.on('GetDataOutside', function (data) {
        setPosServo();
        let [temp,lux,posServo,time] = data.outside.split(",");
        getDataOutside(temp,lux,posServo,time);
        // console.log(data.inside)
    });
    

	socket.on('servoDone', function(message){
		console.log(message);
    });
    
    

});