import "./ClearHistoryButtonHandler.js";
import { updateHistory } from "./openHistoryButtonHandler.js";


let inputLocked = false
const submit = async () => {
    if (inputLocked) {
        return
    }
    inputLocked = true
    const speechBubble = document.getElementById("speech-bubble")
    const inputVal = document.getElementById("input").value;
    const output = document.getElementById("chat-output");
    const img = document.getElementById("cat-img")
    let messageHistory = []

    //Get any potentially existing messages from previous chats
    const localStorageHistory = JSON.parse(localStorage.getItem("chat-history")) ?? ""
    for (let msg of localStorageHistory) {
        if (msg.role === "user") {
            messageHistory.push({
                role: "user",
                content: msg.content
            });
        } else if (msg.role === "assistant") {
            messageHistory.push({
                role: "assistant",
                content: msg.content
            });
        }
    }
    //Add user input to message history
    messageHistory.push({
        role: "user",
        content: inputVal
    })

    //Send request to server to get a response from the AI
    try {
        const response = await fetch("/ask", {
            method: "POST",
            mode: 'cors',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt: inputVal,
                history: messageHistory
            }),
        });

        let data = response.body

        if (!response.ok) {
            const errorText = await response.json();
            data = errorText
            console.log(errorText.error)
        }

        const reader = data.getReader();
        const decoder = new TextDecoder();
        let totalText = "";

        output.innerHTML = "";
        // Read the stream chunk by chunk
        const talkAnim = setInterval(() => {
            if (!img.src.match("./sprites/talking.png") ) {
                img.src = "./sprites/talking.png"
            } else if (img.src.match("./sprites/talking.png") ) {
                img.src = "./sprites/calm.png"
            }
        }, 95)

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
            newTextSpan.textContent = streamText;
            output.scrollTop = output.scrollHeight;


            output.appendChild(newTextSpan);  // Append the new span
            if (speechBubble.classList.contains("invisible")) {
                speechBubble.classList.remove("invisible")
            }
        }

        //Update everything related to a finished output
        output.textContent = totalText;
        clearInterval(talkAnim)
        clearInterval(talkSound)
        messageHistory.push({
            role: "assistant",
            content: totalText
        })
        localStorage.setItem("chat-history", JSON.stringify(messageHistory))

        //Call update history and pass the latest 2 messages (#1 from user and #2 from bot)
        updateHistory([
            messageHistory[messageHistory.length-2],
            messageHistory[messageHistory.length-1]
        ])



        //Update emotion sprite of the cat based on the emotion provided in the output text
        //in the *asterisks*
        const emotionMatch = totalText.match(/\*(angry|blush|cheeky|calm|dizzy|eating|evil grin|happy|injured|love|shocked|smirk|sparkling|squint|tired)\*$/);
        if (emotionMatch) {
            const emotion = emotionMatch[1];
            img.src = `./sprites/${emotion}.png`
        } else {
            //Failsafe default emoji in case the AI decides to be dumb and not return one of
            //the specified emojis, because it does that sometimes.
            img.src = "./sprites/calm.png"
        }

        inputLocked = false;

    } catch (e) {
        console.log(e);
    }
};

function audioPlay() {
    let audio = new Audio('./audio/cat-meow.mp3');
    audio.play()
}

document.getElementById("submit").addEventListener("click", submit);
