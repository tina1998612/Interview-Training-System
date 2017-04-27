var express = require('express');
var app = express();
app.use(express.static('public'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.listen(process.env.PORT || 3000, function() {
    console.log('App listening on port 3000!');
});