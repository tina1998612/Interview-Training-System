(function () {
  "use strict";

  var socket = io.connect('https://localhost:3000');
  var ENTER_KEY_CODE = 13;
  var queryInput, resultDiv, accessTokenInput;
  var recognition;
  var $speechInput, $recBtn;
  var
    messageRecording = "Recording...",
    messageCouldntHear = "I couldn't hear you, could you say that again?",
    messageInternalError = "Oh no, there has been an internal server error",
    messageSorry = "I'm sorry, I don't have the answer to that yet.";
  window.onload = init;
  var num = 0;

  /*
    Function: init

    Init the website page

    Parameters:
        none

    Returns:
        none
  */
  function init() {
    queryInput = document.getElementById("q");
    resultDiv = document.getElementById("result");
    accessTokenInput = "326ac049e8924a699f3c5f5bc601b424";
    var setAccessTokenButton = document.getElementById("set_access_token");
    var setStartSpeakingButton = document.getElementById("start_speaking");
    document.getElementById("main-wrapper").style.display = "none";
    document.getElementById("restart_button").style.display = "none";
    //queryInput.addEventListener("keydown", queryInputKeyDown);
    setAccessTokenButton.addEventListener("click", setAccessToken);
  }

  //jQuery function for the "speak" button.
  $(document).ready(function () {
    $speechInput = $("#speech");
    $recBtn = $("#rec");

    $speechInput.keypress(function (event) {
      if (event.which == 13) {
        event.preventDefault();
        send();
        document.getElementById("speech").value = "";
        document.getElementById("speech").placeholder = "";
      }
    });
    $recBtn.on("click", function (event) {
      switchRecognition();
    });
    $(".debug__btn").on("click", function () {
      $(this).next().toggleClass("is-active");
      return false;
    });
  });

  /*
    Function: startRecognization

    This function is called when the speak button is pressed and the system is recording the speech of interviewee
    Three events of this function
    onstart -- the recording of speech is processing
    onresult -- the recording is finished successfully
    onend -- the recording of the speech is not successful (eg. the microphone is unuseable)

    Parameters:
        none

    Returns:
        none
  */

  function startRecognition() {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    //the record of the speech is processing    
    recognition.onstart = function (event) {
      respond(messageRecording);
      updateRec();
    };

    //the record of the speech is finished successfully
    recognition.onresult = function (event) {
      recognition.onend = null;

      var text = "";
      for (var i = event.resultIndex; i < event.results.length; ++i) {
        text += event.results[i][0].transcript;
      }
      setInput(text);
      stopRecognition();
    };

    //the record of the speech is failed
    recognition.onend = function () {
      respond(messageCouldntHear);
      stopRecognition();
    };
    recognition.lang = "en-US";
    recognition.start();
  }

  /*
  Function: stopRecognition

  stopRecognization() is called when the "stop" button is pressed. The function will 
  stop the recording and the change the "stop" button to "speak" button

  Parameters:
      none

  Returns:
      none
  */
  function stopRecognition() {
    if (recognition) {
      recognition.stop();
      recognition = null;
    }
    updateRec();
  }

  /*
  Function: init

  Init the website page

  Parameters:
      none

  Returns:
      none
  */
  function switchRecognition() {
    if (recognition) {
      stopRecognition();
    } else {
      startRecognition();
    }
  }

  /*
  Function: setInput

  setInput() function will send the response of the user in text format to dialog system

  Parameters:
      none

  Returns:
      none
  */
  function setInput(text) {
    $speechInput.val(text);
    send();
  }

  /*
  Function: updateRec()

  Change the style of the button between "speak" and "stop"

  Parameters:
      none

  Returns:
      none
  */

  function updateRec() {
    $recBtn.text(recognition ? "Stop" : "Speak");
  }

  /*
  Function: send

  send() is used to send the speech in text format to the dialog system (api.ai) 

  Parameters:
      none

  Returns:
      none
  */

  function send() {
    var value = $speechInput.val();
    createQueryNode(value);
    var emos3 = io('https://emosapi.com/');
    //connect
    emos3.on('connect', function () {
      emos3.emit('login', { appkey: 'pJGVK5EO', appsecret: 'ef3c7e0424ec3e8db6b9f7a5cbf26128' });
      emos3.emit('post', { api: 'Personality', version: 'emotion', params: { 'text': value, 'lang': 'en-us', } });
    });
    //api response
    emos3.on('response', function (data) {
      console.log("----3-----");
      console.log(data);
      var e = data.response;
      e = JSON.parse(e);
      socket.emit('personality_text', {
        formality: e.formality,
        intuition: e.intuition,
        thinking: e.thinking,
        judging: e.judging
      });
      console.log({
        formality: e.formality,
        intuition: e.intuition,
        thinking: e.thinking,
        judging: e.judging
      });
      console.log("socket emit");
    });
    //success
    emos3.on('success', function (data) {
      console.log(data);
    });
    //failure
    emos3.on('failure', function (data) {
      console.log(data);
    });

    //sentiment recognition
    var emos4 = io('https://emosapi.com/');
    //connect
    emos4.on('connect', function () {
      emos4.emit('login', { appkey: 'pJGVK5EO', appsecret: 'ef3c7e0424ec3e8db6b9f7a5cbf26128' });
      emos4.emit('post', { api: 'Sentiment', version: 'emotion', params: { 'text': value, 'lang': 'en-us', } });
    });
    //api response
    emos4.on('response', function (data) {
      console.log(data);
      var e = data.response;
      e = JSON.parse(e);
      socket.emit('sentiment_text', {
        score: e.score,
        sentiment: e.label
      });
    });
    //success
    emos4.on('success', function (data) {
      console.log(data);
    });
    //failure
    emos4.on('failure', function (data) {
      console.log(data);
    });
    var responseNode = createResponseNode();
    var temp;
    sendText(value)
      .then(function (response) {
        var result;
        try {
          result = response.result.fulfillment.speech;
          temp = response.result.metadata.intentName;
        } catch (error) {
          result = "";
        }
        setResponseJSON(response);
        setResponseOnNode(result, responseNode);
        if (temp == "test.end") {
          console.log("test end");
          document.getElementById("start_heading").style.display = "none";
          document.getElementById("start").style.display = "none";
          document.getElementById("end_heading").style.display = "block";
          document.getElementById("end_button").style.display = "block";
        }
      })
      .catch(function (err) {
        setResponseJSON(err);
        setResponseOnNode("Something goes wrong", responseNode);
      });
  }

  /*
  Function: respond

  respond() is used to do text-to-speech conversation of the response of the dialog system
  If the respond does not get from the system, the messageSorry will be used

  Parameters:
      none

  Returns:
      none
  */

  function respond(val) {
    if (val == "") {
      val = messageSorry;
    }

    if (val !== messageRecording) {
      var msg = new SpeechSynthesisUtterance();
      msg.voiceURI = "native";
      msg.text = val;
      msg.lang = "en-US";
      window.speechSynthesis.speak(msg);
    }

    $("#spokenResponse").addClass("is-active").find(".spoken-response__text").html(val);
  }

  /*
  Function: setAccessToken

  The setAccessToken() will be call when the "start the interview" is called.
  The function will show the "main-wrapper" and hide the "start page" and "jsonResponse"

  Parameters:
      none

  Returns:
      none
 */

  function setAccessToken() {
    document.getElementById("start_page").style.display = "none";
    document.getElementById("main-wrapper").style.display = "block";
    document.getElementById("end_heading").style.display = "none";
    document.getElementById("jsonResponse").style.display = "none";
    document.getElementById("end_button").style.display = "none";
    document.getElementById("restart_button").style.display = "block";
    window.init(accessTokenInput);
    console.log("start send the first query");
    var value = "0000start0000";
    var responseNode = createResponseNode();
    sendText(value)
      .then(function (response) {
        var result;
        try {
          result = response.result.fulfillment.speech;
        } catch (error) {
          result = "";
        }
        setResponseJSON(response);
        setResponseOnNode(result, responseNode);
      })
      .catch(function (err) {
        setResponseJSON(err);
        setResponseOnNode("Something goes wrong", responseNode);
      });
    console.log("finish the first query sending");
  }

  /*
  Function: queryInputKeyDown

  queryInputKeyDown() will send the speech of the interviewee to the dialog system 

  Parameters:
      event

  Returns:
      none
  */

  function queryInputKeyDown(event) {
    if (event.which !== ENTER_KEY_CODE) {
      return;
    }

    var value = queryInput.value;
    queryInput.value = "";

    createQueryNode(value);
    var responseNode = createResponseNode();

    sendText(value)
      .then(function (response) {
        var result;
        try {
          result = response.result.fulfillment.speech
        } catch (error) {
          result = "";
        }
        setResponseJSON(response);
        setResponseOnNode(result, responseNode);
      })
      .catch(function (err) {
        setResponseJSON(err);
        setResponseOnNode("Something goes wrong", responseNode);
      });
  }

  /*
  Function: createQueryNode

  createQueryNode() will create the node according to the query of the interviewee
  and show the query on the website page

  Parameters:
      query

  Returns:
      none
  */

  function createQueryNode(query) {
    var node = document.createElement('div');
    //node.className = "clearfix left-align left card-panel green accent-1";
    node.className = "query_text";
    node.innerHTML = query;
    node.id = num;
    resultDiv.appendChild(node);
    if (num >= 3) {
      document.getElementById(num - 1).style.display = "none";
      document.getElementById(num - 2).style.display = "none";
    }
    else if (num == 1) {
      document.getElementById(0).style.display = "none";
    }
    num++;
  }

  /*
  Function: createResponseNode

  createResponseNode() will create the node according to the response of the dialog system
  and show the response on the website page

  Parameters:
      query

  Returns:
      none
  */

  function createResponseNode() {
    var node = document.createElement('div');
    //node.className = "clearfix right-align right card-panel blue-text text-darken-2 hoverable";
    node.className = "response_text";
    node.innerHTML = "...";
    node.id = num;
    resultDiv.appendChild(node);
    num++;
    return node;
  }

  /*
  Function: setResponseOnNOde

  setResponseOnNode() will do the Text-to-speech convertion of the response of the dialog system
  The system will speak the response of the dialog system once when the response is created
  User can also click the answer of the response and the system will speak that response again.

  Parameters:
      response, node

  Returns:
      none
  */

  function setResponseOnNode(response, node) {
    node.innerHTML = response ? response : "[empty response]";
    node.setAttribute('data-actual-response', response);
    var speaking = false;

    function speakNode() {
      if (!response || speaking) {
        return;
      }
      speaking = true;
      tts(response)
        .then(function () { speaking = false })
        .catch(function (err) {
          speaking = false;
          Materialize.toast(err, 2000, 'red lighten-1');
        });
    }

    node.addEventListener("click", speakNode);
    speakNode();
  }


  //not used now
  function stratRecognization() {
    recognization = new webkitSpeechRecognition();
    recognization.continuous = false;
    recognition.interimResults = false;

    //recognization.continuous
  }

  //not used now
  function setResponseJSON(response) {
    //var node = document.getElementById("jsonResponse");
    //node.innerHTML = JSON.stringify(response, null, 2);
  }

  //not used now
  function sendRequest() {

  }

}
)();
