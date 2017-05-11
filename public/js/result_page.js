var doc = new jsPDF();
doc.setFont('times');
var overall_score = 0, grammar_score = 0;

var socket = io.connect('http://localhost:3000');
//var socket = io.connect('https://interview-training-system.herokuapp.com/');
socket.emit('end', {
    text: 'interview end'
});
socket.on('result', function (result_data) {
    //console.log(data.reply_text);

    console.log(result_data);
    //pdf display 
    var quality_of_answers = [];
    var doc_text = "";
    var reply = result_data.reply_text.data;
    doc.setFontType('bolditalic');
    doc.setFontSize(23);
    doc.text("Interview Transcript", 70, 10);
    for (var i = 0; i < reply.length; i++) {
        var score = reply[i].score;
        doc.setFontType('normal');
        doc.setDrawColor(0);
        var user_say = reply[i].user_say;
        user_say = user_say.charAt(0).toUpperCase() + user_say.slice(1);
        $('#dialog').append("<div class='text-left'><i><b>You&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp</i></b>" + user_say + "</div>");
        switch (score) {
            case 1:
                score = 100;
                $('#dialog').append('<span class="g">' + score + "%</span>");
                break;
            case 0.5:
                score = 75;
                $('#dialog').append('<span class="g">' + score + "%</span>");
                break;
            case -0.5:
                score = 50;
                $('#dialog').append('<span class="r">' + score + "%</span>");
                break;
            case -1:
                score = 25;
                $('#dialog').append('<span class="r">' + score + "%</span>");
                break;
        }
        if (score != 0) { // if score is defined in api.ai
            quality_of_answers.push(score);
            //console.log(score);

            if (overall_score == 0) {
                overall_score = score;
            }
            overall_score = (overall_score + score) / 2;
        }

        doc_text += "You:               " + user_say;
        doc_text = doc_text.trim();
        if (doc_text[-1] != '\n') doc_text += '\n';

        $.get("https://api.textgears.com/check.php?text=" + user_say.split(' ').join('+') + "!&key=toEndwaB3oa8ApU6", function (data) {
            grammar_score = (grammar_score + data.score) / 2;
            console.log(grammar_score);
        });

        var system_say = reply[i].system_say;
        system_say = system_say.charAt(0).toUpperCase() + system_say.slice(1);
        doc_text += "Interviewer:   " + system_say + '\n';
        $('#dialog').append("<div class='text-left'>" + "<i><b>Interviewer&nbsp&nbsp&nbsp</i></b>" + system_say + '</div>');
    }

    var y = 25;
    doc.setFontType('normal');
    doc.setFontSize(18);
    doc.text("FINAL SCORE: " + overall_score, 10, y); y += 8;
    doc.text("Total duration: " + result_data.time.data, 10, y); y += 10;

    doc.setFontSize(16.5);
    doc.text("EMOTION: ", 10, y); y += 7;
    doc.setFontSize(15);
    doc.text("* angry: " + result_data.emotion_audio.angry * 100, 10, y); y += 5;
    doc.text("* criticism: " + result_data.emotion_audio.criticism * 100, 10, y); y += 5;
    doc.text("* happy: " + result_data.emotion_audio.happy * 100, 10, y); y += 5;
    doc.text("* loneliness: " + result_data.emotion_audio.loneliness * 100, 10, y); y += 5;
    doc.text("* sad: " + result_data.emotion_audio.sad * 100, 10, y); y += 5;
    doc.text("* anxiety: " + result_data.emotion_audio.anxiety * 100, 10, y); y += 10;

    doc.setFontSize(16.5);
    doc.text("PERSONALITY: ", 10, y); y += 7;
    doc.setFontSize(15);
    doc.text("* formality: " + result_data.personality_text.formality, 10, y); y += 5;
    doc.text("* intuition: " + result_data.personality_text.intuition, 10, y); y += 5;
    doc.text("* thinking: " + result_data.personality_text.thinking, 10, y); y += 5;
    doc.text("* judging: " + result_data.personality_text.judging, 10, y); y += 10;

    doc.setFontSize(16.5);
    doc.text("SENTIMENT: ", 10, y); y += 7;
    doc.setFontSize(15);
    doc.text("* average: " + result_data.sentiment_text.sentiment_avg, 10, y); y += 5;
    var sentiment_label = "neutral";
    if (result_data.sentiment_text.sentiment_avg > 0) sentiment_label = "positive";
    else if (result_data.sentiment_text.sentiment_avg < 0) sentiment_label = "negative";
    doc.text("* label: " + sentiment_label, 10, y); y += 10;

    doc.setFontSize(16.5);
    doc.text("WHOLE DIALOG: ", 10, y); y += 7;
    doc.setFontSize(15);
    var cnt = 0, index = 0;
    for (var i = 0; i < doc_text.length; i++) {
        if (doc_text[i] == '\n') cnt++;
        if (cnt > 20) {
            index = i;
            break;
        }
    }
    doc.text(doc.splitTextToSize(doc_text.slice(0, index), 190), 10, y);

    doc.addPage();
    y = 10; //reset y
    doc.text(doc.splitTextToSize(doc_text.slice(index), 190), 10, y);

    //window.open("data:application/pdf," + encodeURI(data.reply_text));

    setTimeout(function () {
        if (grammar_score > 60) $('#dialog').append('<br><h3 class="text-left">Grammar score: <span class="g">' + grammar_score + '%</span></h3>');
        else $('#dialog').append('<br><h3 class="text-left">Grammar score: <span class="r">' + grammar_score + '%</span></h3>');

        var text_to_append;
        overall_score = overall_score * 55 / 100 + grammar_score * 30 / 100 + (1 - result_data.emotion_audio.anxiety) * 100 * 15 / 100;
        if (sentiment_label == "negative") overall_score -= 10;
        else overall_score += 10;
        if (overall_score > 60) text_to_append = '<br><br><hr><b><h2 class="text-left">Final Score: <span class="g">' + overall_score + '%</span></b></h2>';
        else text_to_append = '<br><br><hr><b><h2 class="text-left">Final Score: <span class="r">' + overall_score + '%</span></b></h2>';
        $('#dialog').append(text_to_append);
    }, 3000);

    //chart.js
    $(document).ready(function () {
        var ctx = $("#myChart").get(0).getContext("2d");
        ctx.canvas.width = 175;
        ctx.canvas.height = 175;
        var ctx1 = $("#myChart1").get(0).getContext("2d");
        ctx1.canvas.width = 175;
        ctx1.canvas.height = 175;
        var ctx2 = $("#myChart2").get(0).getContext("2d");
        ctx2.canvas.width = 175;
        ctx2.canvas.height = 175;
        var ctx3 = $("#myChart3").get(0).getContext("2d");
        ctx3.canvas.width = 175;
        ctx3.canvas.height = 175;
        var ctx4 = $("#myChart4").get(0).getContext("2d");
        ctx4.canvas.width = 175;
        ctx4.canvas.height = 175;
        var data = {
            labels: ["angry", "anxiety", "criticism", "happy", "loneliness", "sad"],
            datasets: [
                {
                    label: "Emotion",
                    backgroundColor: "rgba(179,181,198,0.2)",
                    borderColor: "rgba(179,181,198,1)",
                    pointBackgroundColor: "rgba(179,181,198,1)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(179,181,198,1)",
                    data: [result_data.emotion_audio.angry, result_data.emotion_audio.anxiety, result_data.emotion_audio.criticism, result_data.emotion_audio.happy, result_data.emotion_audio.loneliness, result_data.emotion_audio.sad]
                }

            ]
        };
        var data1 = {
            labels: ["Judging", "Thinking", "Intuition", "Formality"],
            datasets: [
                {
                    label: "Personality",
                    backgroundColor: "rgba(255,99,132,0.2)",
                    borderColor: "rgba(255,99,132,1)",
                    pointBackgroundColor: "rgba(255,99,132,1)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(255,99,132,1)",

                    data: [result_data.personality_text.judging, result_data.personality_text.thinking, result_data.personality_text.intuition, result_data.personality_text.formality]
                },
            ]
        };
        var data2 = {
            labels: [" ", " ", " ", " ", " ", " ", " ", " ", " "],
            datasets: [
                {
                    label: "Sentiment",
                    fill: false,
                    lineTension: 0.1,
                    backgroundColor: "rgba(75,192,192,0.4)",
                    borderColor: "rgba(75,192,192,1)",
                    borderCapStyle: 'butt',
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: 'miter',
                    pointBorderColor: "rgba(75,192,192,1)",
                    pointBackgroundColor: "#fff",
                    pointBorderWidth: 1,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: "rgba(75,192,192,1)",
                    pointHoverBorderColor: "rgba(220,220,220,1)",
                    pointHoverBorderWidth: 2,
                    pointRadius: 1,
                    pointHitRadius: 10,
                    data: result_data.sentiment_text.sentiment_score,
                    spanGaps: false,
                }
            ]
        };
        var data3 = {
            labels: [" ", " ", " ", " ", " ", " ", " ", " ", " "],
            datasets: [
                {
                    label: "Anxiety",
                    fill: false,
                    lineTension: 0.1,
                    backgroundColor: "rgba(206, 0, 0, 0.4)",
                    borderColor: "rgba(206, 0, 0, 0.4)",
                    borderCapStyle: 'butt',
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: 'miter',
                    pointBorderColor: "rgba(75,192,192,1)",
                    pointBackgroundColor: "#fff",
                    pointBorderWidth: 1,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: "rgba(75,192,192,1)",
                    pointHoverBorderColor: "rgba(220,220,220,1)",
                    pointHoverBorderWidth: 2,
                    pointRadius: 1,
                    pointHitRadius: 10,
                    data: result_data.emotion_audio.anxiety_arr,
                    spanGaps: false,

                }
            ]
        };
        var data4 = {
            labels: [" ", " ", " ", " ", " ", " ", " ", " ", " "],
            datasets: [
                {
                    label: "Quality of Answers",
                    fill: false,
                    lineTension: 0.1,
                    backgroundColor: "rgba(92,175,92,0.4)",
                    borderColor: "rgba(92,175,92,1)",
                    borderCapStyle: 'butt',
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: 'miter',
                    pointBorderColor: "rgba(75,192,192,1)",
                    pointBackgroundColor: "#fff",
                    pointBorderWidth: 1,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: "rgba(75,192,192,1)",
                    pointHoverBorderColor: "rgba(220,220,220,1)",
                    pointHoverBorderWidth: 2,
                    pointRadius: 1,
                    pointHitRadius: 10,
                    data: quality_of_answers,
                    spanGaps: false,
                }
            ]
        };
        var myRadarChart = new Chart(ctx, {
            type: 'radar',
            data: data,
            options: {

                scale: {
                    reverse: false,
                    ticks: {
                        showLabelBackdrop: false,
                        beginAtZero: true,
                        max: 1
                    }
                }
            }
        })
        var myRadarChart1 = new Chart(ctx1, {
            type: 'radar',
            data: data1,
            options: {

                scale: {

                    reverse: false,
                    ticks: {
                        showLabelBackdrop: false,
                        beginAtZero: true,
                        max: 100
                    }
                }

            }
        })
        var myLineChart2 = new Chart(ctx2, {
            type: 'line',
            data: data2,
            options: {
                scales: {
                    xAxes: [{
                        stacked: true,
                        ticks: {
                            max: result_data.sentiment_text.sentiment_score.length,
                        }
                    }],
                    yAxes: [{
                        stacked: true,
                        ticks: {
                            min: -1,
                            max: 1,
                        }
                    }]
                }
            }
        });
        var myLineChart3 = new Chart(ctx3, {
            type: 'line',
            data: data3,
            options: {
                scales: {

                    yAxes: [{
                        stacked: true
                    }]

                }
            }
        });
        var myLineChart4 = new Chart(ctx4, {
            type: 'line',
            data: data4,
            options: {
                scales: {

                    yAxes: [{
                        stacked: true
                    }]

                }
            }
        });

    });


    // send email
    $.ajax({
        url: "https://api.mlab.com/api/1/databases/trial/collections/email?apiKey=dYilzi84IUE-jAIzTrRmFLRVsziNwyp3",
    }).done(function (data) {
        $.each(data, function (key, data) {
            var output = data.email;
            var name;
            $.ajax({
                url: "https://api.mlab.com/api/1/databases/trial/collections/name?apiKey=dYilzi84IUE-jAIzTrRmFLRVsziNwyp3",
            }).done(function (data) {
                $.each(data, function (key, data) {
                    name = data.name;
                    (function () {
                        emailjs.init("user_NjcGkGanGey2r7ujCq4uS");
                    })();
                    if (overall_score > 60) {
                        emailjs.send("gmail", "congratulations", { "output": output, "name": name })
                            .then(function (response) {
                                console.log("SUCCESS. status=%d, text=%s", response.status, response.text);
                            }, function (err) {
                                console.log("FAILED. error=", err);
                            });
                    }
                    else {
                        emailjs.send("gmail", "reject", { "output": output, "name": name })
                            .then(function (response) {
                                console.log("SUCCESS. status=%d, text=%s", response.status, response.text);
                            }, function (err) {
                                console.log("FAILED. error=", err);
                            });
                    }
                });
            });
        });
    });
});

$('#download').click(function () {
    doc.save('interview_dialog.pdf');
});