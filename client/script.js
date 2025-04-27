import "./ClearHistoryButtonHandler.js";
import { updateHistory } from "./openHistoryButtonHandler.js";


let inputLocked = false
const submit = async () => {
    //Check if input is still locked from previous message
    if (inputLocked) {
        return
    }
    inputLocked = true
    const speechBubble = document.getElementById("speech-bubble")
    const output = document.getElementById("chat-output");
    const img = document.getElementById("cat-img")
    const memeImg = document.getElementById("memeimg")
    let inputVal = document.getElementById("input");
    let messageHistory = []

    memeImg.classList.remove("fade-in-meme")
    memeImg.classList.add("invisible")

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
        content: inputVal.value
    })

    //Send request to server to get a response from the AI
    try {
        const response = await fetch("http://localhost:3000/ask", {
            method: "POST",
            mode: 'cors',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt: inputVal.value,
                history: messageHistory
            }),
        });

        let data = response.body

        //Clear input field after doing everything it was needed for
        inputVal.value = ""
        //Clear output field from previous messages
        output.innerHTML = "";

        //error handling
        if (!response.ok) {
            const errorText = await response.json();
            data = errorText
            console.log(errorText.error)
        }

        //create stream reader
        const reader = data.getReader();
        const decoder = new TextDecoder();
        let totalText = "";



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
            //Make speech bubble visible if it wasn't yet
            if (speechBubble.classList.contains("invisible")) {
                speechBubble.classList.remove("invisible")
            }

            //start reading stream
            const { done, value } = await reader.read();
            if (done) break;

            const chunkText = decoder.decode(value, { stream: true });

            const lines = chunkText.split("\n").filter(Boolean);
            for (let line of lines) {
                const parsed = JSON.parse(line);

                if (parsed.type === "meme") {
                    //set meme image element's source to the URl that was provided in the json object
                    memeImg.src = parsed.memeUrl;

                    //wait a couple milliseconds for src to update
                    setTimeout(() => {
                        memeImg.classList.remove("invisible")
                        memeImg.classList.add("fade-in-meme")
                    }, 10)
                }
                //stream text
                //add every chunk as an individual text spans (for fade in animation on each word).
                //when it's done it'll convert all of them to 1 single element on line 123
                else if (parsed.type === "text") {
                    totalText += parsed.content;
                    const newTextSpan = document.createElement("span");
                    newTextSpan.className = "fade-in";
                    newTextSpan.textContent = parsed.content;
                    output.appendChild(newTextSpan);
                }
            }
        }

        //Update everything related to a finished output
        output.textContent = totalText;

        //turn off cat sprite animation and sound
        clearInterval(talkAnim)
        clearInterval(talkSound)

        //add new AI message to history
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

        //unlock input so user can send another message
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
