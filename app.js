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
    sentiment_text: { 'type': Object, 'default': undefined }
});
var User = mongoose.model('User', mySchema);
var index = 0;
mongoose.Promise = global.Promise;
User.remove().exec();

con.on('error', console.error.bind(console, 'connection error:'));
con.once('open', function () {
    console.log("successful connected to mlab!");

    //socketio
    var test = [];
    test[index] = new User({
        emotion_audio: undefined,
        personality_text: undefined,
        sentiment_text: undefined
    });
    io.on('connection', function (socket) {
        socket.on('emotion_audio', function (data) {
            console.log('emotion_audio', data);
            test[index].emotion_audio = data;
        });
        socket.on('personality_text', function (data) {
            console.log('personality_text', data);
            test[index].personality_text = data;
        });
        socket.on('sentiment_text', function (data) {
            console.log('sentiment_text', data);
            test[index].sentiment_text = data;
        });
        setInterval(function () {
            if (test[index].personality_text != undefined && test[index].sentiment_text != undefined) {
                test[index].save(function (err) {
                    if (!err) {
                        console.log('Success!');
                        test[index].emotion_audio = undefined;
                        test[index].personality_text = undefined;
                        test[index].sentiment_text = undefined;
                        index++;
                        test[index] = new User({
                            emotion_audio: undefined,
                            personality_text: undefined,
                            sentiment_text: undefined
                        });
                    } else console.log(err);
                });
            }
        }, 500);

    });
});


app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

server.listen(process.env.PORT || 3000, function () {
    console.log('App listening on port 3000!');
    console.log(process.env.PORT);
});