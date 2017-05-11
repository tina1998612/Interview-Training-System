var express = require('express');
var app = express();
var bodyParser = require('body-parser')
var mongoose = require('mongoose');
var server = require('http').Server(app);
var io = require('socket.io')(server);

//mongoose
mongoose.connect('mongodb://tina87612:tina87612@ds123371.mlab.com:23371/interview');
var con = mongoose.connection;
var Schema = mongoose.Schema;
var mySchema = new Schema({
    emotion_audio: { 'type': Object, 'default': undefined },
    personality_text: { 'type': Object, 'default': undefined },
    sentiment_text: { 'type': Object, 'default': undefined },
    reply_text: { 'type': Object, 'default': undefined },
    time: { 'type': Object, 'default': undefined }
});
var User = mongoose.model('User', mySchema);
var index = 0;
mongoose.Promise = global.Promise;
User.remove().exec();

con.on('error', console.error.bind(console, 'connection error:'));
con.once('open', function () {
    console.log("successful connected to mlab!");

    var test = new User({
        emotion_audio: {
            angry: 0.5,
            anxiety: 0.5,
            criticism: 0.5,
            happy: 0.5,
            loneliness: 0.5,
            sad: 0.5,
            anxiety_arr: []
        },
        personality_text: {
            formality: 50,
            intuition: 50,
            thinking: 50,
            judging: 50
        },
        sentiment_text: {
            sentiment_score: [],
            sentiment_avg: 0
        },
        reply_text: {
            data: []
        },
        time: {
            data: ""
        }
    });

    //socketio: receive data from client side  
    io.on('connection', function (socket) {
        socket.on('start', function (data) {
            console.log("restart");
            // initialize 
            test.emotion_audio.angry = 0.5;
            test.emotion_audio.anxiety = 0.5;
            test.emotion_audio.criticism = 0.5;
            test.emotion_audio.happy = 0.5;
            test.emotion_audio.loneliness = 0.5;
            test.emotion_audio.sad = 0.5;
            test.emotion_audio.anxiety_arr = [];

            test.personality_text.formality = 50;
            test.personality_text.intuition = 50;
            test.personality_text.thinking = 50;
            test.personality_text.judging = 50;

            test.sentiment_text.sentiment_score = [];
            test.sentiment_text.sentiment_avg = 0;

            test.reply_text.data = [];
        });
        socket.on('emotion_audio', function (data) {
            // take the average of all data
            //console.log("audio!!!");
            test.emotion_audio.angry = (test.emotion_audio.angry + data.angry) / 2;
            test.emotion_audio.anxiety = (test.emotion_audio.anxiety + data.anxiety) / 2;
            test.emotion_audio.criticism = (test.emotion_audio.criticism + data.criticism) / 2;
            test.emotion_audio.happy = (test.emotion_audio.happy + data.happy) / 2;
            test.emotion_audio.loneliness = (test.emotion_audio.loneliness + data.loneliness) / 2;
            test.emotion_audio.sad = (test.emotion_audio.sad + data.sad) / 2;
            var arr = test.emotion_audio.anxiety_arr.slice(0);
            arr.push(data.anxiety);
            test.emotion_audio.anxiety_arr = arr;
            //console.log(test.emotion_audio.anxiety_arr);
        });
        socket.on('personality_text', function (data) {
            test.personality_text.formality = (test.personality_text.formality + data.formality) / 2;
            test.personality_text.intuition = (test.personality_text.intuition + data.intuition) / 2;
            test.personality_text.thinking = (test.personality_text.thinking + data.thinking) / 2;
            test.personality_text.judging = (test.personality_text.judging + data.judging) / 2;
            //console.log('personality_text', test.personality_text);
        });
        socket.on('sentiment_text', function (data) {
            var arr = test.sentiment_text.sentiment_score.slice(0);
            arr.push(data.sentiment_score);
            test.sentiment_text.sentiment_score = arr;
            test.sentiment_text.sentiment_avg = (test.sentiment_text.sentiment_avg + data.sentiment_score) / 2;
            //console.log('sentiment_text', test.sentiment_text);
        });

        socket.on('reply', function (str) {
            var score = 0;
            var label = str.substr(0, str.indexOf(' '));
            var user_say = str.substr(str.indexOf(' ') + 1, str.indexOf('\n') - 2);
            var system_say = str.substr(str.indexOf('\n') + 1);
            if (label.charAt(0) == 'g') { // if this is a good answer
                score = label.length / 2;
            } else if (label.charAt(0) == 'b') { // else if bad answer
                score = -1 * label.length / 2;
            }
            //console.log(label, score);
            var arr = test.reply_text.data.slice(0);
            arr.push({
                score: score,
                user_say: user_say,
                system_say: system_say
            });
            test.reply_text.data = arr;
        });
        socket.on('time', function (data) {
            test.time.data = data;
        });
        // save all the data to mlab once the interview is finished
        socket.on('end', function (data) {
            //console.log("end!!!");
            User.remove().exec();
            test.save(function (err) {
                if (!err) {
                    console.log('Success!');
                } else console.log(err);
            });
            console.log(test);
            socket.emit('result', test);
        });

    });
});

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

server.listen(process.env.PORT || 3000, function () {
    console.log('App listening on port 3000!');
});