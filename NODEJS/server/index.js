const PORT = 8888;	

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapterdb = new FileSync('./db.json')
const adapterdbs = new FileSync('./dataset.json')
const adapterSchedule = new FileSync('./schedule.json')
const db = low(adapterdb)
const dataset = low(adapterdbs)
var schedule = low(adapterSchedule);

db.defaults({ data : [] })
  .write()

schedule.defaults({ data : {} })
  .write()

var path = require('path');
var express = require("express")							//Đặt địa chỉ Port được mở ra để tạo ra chương trình mạng Socket Server
var ip = require('ip');
var app = express();
app.use(express.static(path.resolve('../client')));
var bodyparser = require('body-parser');


var server = require('http').Server(app);         //#Khởi tạo một chương trình mạng (app)
var io = require('socket.io')(server);            //#Phải khởi tạo io sau khi tạo app!

// Khai bao ML
const tf = require('@tensorflow/tfjs');
const { isObject } = require('util');

tf.disableDeprecationWarnings();

const trainingData = tf.tensor2d(dataset.get('data').value().map(item=> [
    item.InsideTemp, item.InsideLux, item.OutsideTemp, item.OutsideLux
]
),[dataset.get('data').value().length,4])
// console.log(dataset.get('data').value().length)
const outputData = tf.tensor2d(dataset.get('data').value().map(item => [
    item.Servo == 0 ? 1 : 0,
    item.Servo == 30 ? 1 : 0,
    item.Servo == 45 ? 1 : 0,
    item.Servo == 60 ? 1 : 0,
    item.Servo == 90 ? 1 : 0,
    item.Servo == 120 ? 1 : 0,
    item.Servo == 135 ? 1 : 0,
    item.Servo == 150 ? 1 : 0,
    item.Servo == 180 ? 1 : 0,

]), [dataset.get('data').value().length , 9])

const model = tf.sequential();


model.add(tf.layers.dense(
    {   inputShape: 4, 
        activation: 'sigmoid', 
        units: 50
    }
));

model.add(tf.layers.dense(
    {
        inputShape: 50,
        activation: 'sigmoid',
        units: 10
    }
))

model.add(tf.layers.dense(
    {
        inputShape: 10, 
        units: 9, 
        activation: 'softmax'
    }
));

model.summary();

model.compile({
    loss: "categoricalCrossentropy",
    optimizer: tf.train.adam()
});

async function train_data(){

	console.log("Training Started");
    for(let i=0;i<10;i++){
		let res = await model.fit(trainingData, outputData, {epochs: 50});
		console.log(`Iteration ${i}: ${res.history.loss[0]}`);
	}
	console.log("Training Complete");
}
//Ket thuc khai bao ML

server.listen(PORT, async function () {
    console.log("Server Nodejs chay tai dia chi: " + ip.address() + ":" + PORT)
    await train_data();
});


app.get('/', function (req, res) {
    res.sendfile(path.resolve('../client/index.html'));
});

app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());



var inside = { temp: 0, lux : 0}
var currentStatus = { TimeStamp : 0, InsideTemp : 0, InsideLux : 0, OutsideTemp : 0,OutsideLux : 0, Servo : 0}
function getDataInside(vtemp, vlux, vtime) {
        console.log("Get data inside");

        inside.temp = vtemp;
        inside.lux = vlux;
    return 0
}

async function getDataOutside(vtemp, vlux, vposServo, vtime) {
    console.log("Get data outside");
    currentStatus.InsideLux = inside.lux;
    currentStatus.InsideTemp = inside.temp;
    currentStatus.OutsideLux = vlux;
    currentStatus.OutsideTemp = vtemp;
    currentStatus.TimeStamp = vtime;
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
    //START ML

        var test =await tf.tensor2d([parseFloat(inside.temp), parseFloat(inside.lux), parseFloat(vtemp), parseFloat(vlux)], [1,4]);
        // console.log('test: '+test);
        
        var out = await model.predict(test);
        // console.log('out: '+out);
        
        const tensorData = out.dataSync();
        var maxIndex = 0;
        for (let i = 1 ; i < 9; i++){
            if (tensorData[i] > tensorData[maxIndex]){
                maxIndex = i;
            }
        }
    
        // console.log('max index = ' + maxIndex);
    
        ans = "Undetermined";
    
        switch(maxIndex) {
            case 0:
                ans = '0';	
            break;
            case 1:
                ans = '30';	
            break;
            case 2:
                ans = '45';	
            break;	
            case 3:
                ans = '60';	
            break;
            case 4:
                ans = '90';	
            break;
            case 5:
                ans = '120';	
            break;
            case 6:
                ans = '135';	
            break;
            case 7:
                ans = '150';	
            break;
            case 8:
                ans = '180';	
            break;
        }

        io.sockets.emit('setServo', parseInt(ans));
    //END ML
      
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

    socket.on('FirstConnect', function (message) {
        console.log(message);
    });

    socket.on('Connect', function (message) {
        console.log(message);
    });

    socket.on('requestData', function(check){
        if(check){
            let data = db.get('data')
                        .value()
            data = data.slice(data.length - 3)

            socket.emit('sendData',data)
        }
    })
    socket.on('postDataServo', function(pos){
        var pos = parseInt(pos);
        dataset.get('data')
        .push({ 
                    TimeStamp: currentStatus.TimeStamp,
                    InsideTemp: currentStatus.InsideTemp, 
                    InsideLux: currentStatus.InsideLux,
                    OutsideTemp: currentStatus.OutsideTemp,
                    OutsideLux: currentStatus.OutsideLux,
                    Servo : pos,
                })
      .write();
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

    socket.on('changeDataSchedule',(data) => {
        // console.log("=================",data.monAM);
        schedule.set("data",data)
                .write();

        temp = schedule.get("data").value()
        console.log(temp)

    });
    socket.on('requestScheduleData',(check)=>{
        if(check){
            const dataSchedule = schedule.get('data').value();
            console.log(dataSchedule);
            socket.emit("sendScheduleData", dataSchedule);
        }
    })
});
