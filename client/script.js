let inputLocked = false

const submit = async () => {
    if (inputLocked) {
        return
    }
    inputLocked = true
    const speechBubble = document.getElementById("speech-bubble")
    const inputVal = document.getElementById("input").value;
    const output = document.getElementById("chat-output");
    const chatHistory = document.getElementById("chat-history")
    const img = document.getElementById("cat-img")

    try {
        const response = await fetch("http://localhost:3000/ask", {
            method: "POST",
            mode: 'cors',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt: inputVal }),
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let totalText = "";

        output.innerHTML = "";
        // Read the stream chunk by chunk
        const talkAnim = setInterval(() => {
            console.log(img.src)
            if (!img.src.match("sprites/talking.png") ) {
                img.src = "sprites/talking.png"
            } else if (img.src.match("sprites/talking.png") ) {
                img.src = "sprites/calm.png"
            }
        }, 97)

        const talkSound = setInterval(() => {
            audioPlay()
        }, 195)


        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const streamText = decoder.decode(value, { stream: true });
            totalText += streamText;

            const newTextSpan = document.createElement("span");
            newTextSpan.className = "fade-in";
            newTextSpan.innerText = streamText;


            output.appendChild(newTextSpan);  // Append the new span
            if (speechBubble.classList.contains("invisible")) {
                speechBubble.classList.remove("invisible")
            }
        }
        output.textContent = totalText;
        clearInterval(talkAnim)
        clearInterval(talkSound)
        img.src = "sprites/calm.png"


        const emotionMatch = totalText.match(/\*(angry|blush|cheeky|calm|dizzy|eating|evil grin|happy|injured|love|shocked|smirk|sparkling|squint|tired)\*$/);
        if (emotionMatch) {
            const emotion = emotionMatch[1];
            img.src = `sprites/${emotion}.png`
        }


        //Add messages to chat history
        const chatHistoryInput = document.createElement("p")
        const chatHistoryOutput = document.createElement("p")

        chatHistoryInput.innerText = `You: ${inputVal}`
        chatHistoryOutput.innerText = `Cat: ${totalText}`

        chatHistory.appendChild(chatHistoryInput)
        chatHistory.appendChild(chatHistoryOutput)

        inputLocked = false;

    } catch (e) {
        console.log(e);
    }
};

function audioPlay() {
    let audio = new Audio('audio/cat-meow.mp3');
    audio.play()
}

document.getElementById("submit").addEventListener("click", submit);
