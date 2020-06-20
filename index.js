var express = require('express');
var app = express();

const tf = require('@tensorflow/tfjs');
const data = require('./data.json');

tf.disableDeprecationWarnings();

const trainingData = tf.tensor2d(data.map(item=> [
    item.InsideTemp, item.InsideLux, item.OutsideTemp, item.OutsideLux
]
),[653,4])

const outputData = tf.tensor2d(data.map(item => [
    item.Servo == 0 ? 1 : 0,
    item.Servo == 30 ? 1 : 0,
    item.Servo == 45 ? 1 : 0,
    item.Servo == 60 ? 1 : 0,
    item.Servo == 90 ? 1 : 0,
    item.Servo == 120 ? 1 : 0,
    item.Servo == 135 ? 1 : 0,
    item.Servo == 150 ? 1 : 0,
    item.Servo == 180 ? 1 : 0,

]), [653,9])

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

app.use(express.static('./public')).get('/', function (req, res) {
    res.sendFile('./index.html');
});

var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));

app.post('/predict', function(req, res) {

    var test = tf.tensor2d([parseFloat(req.body.InTemp), parseFloat(req.body.InLux), parseFloat(req.body.OutTemp), parseFloat(req.body.OutLux)], [1,4]);
    console.log('test: '+test);
    
    var out = model.predict(test);
    console.log('out'+out);

    var maxIndex = 0;
    for (let i=1;i<out.size; i++){
    	if (out.buffer().get(0, i) > out.buffer().get(0, maxIndex)){
    		maxIndex = i;
    	}
    }

    console.log('max index = ' + maxIndex);

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

    console.log(ans);
	
	res.send(ans);

});

var doTrain = async function (req, res, next) {
	await train_data();
	next();
}

app.use(doTrain).post('/train', function(req, res) {
	res.send("1");
});

app.listen(3000);