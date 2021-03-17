var speechRecognition = window.webkitSpeechRecognition
console.log("in js file")

var recognition = new speechRecognition()

var searchbar = $("#searchbar")

var instructions = $("#instructions")

var content = ''

recognition.continuous = true

recognition.onstart = function() {
    instructions.text("Voice recognition is on")
}

$("#start-btn").click(function(event) {
    if(content.length) {
        content += ''
    }

    recognition.start()
})