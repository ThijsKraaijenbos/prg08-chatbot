let historyOpen = false
const chatHistory = document.getElementById("chat-history")
const historyButton = document.getElementById("history-button")
historyButton.addEventListener("click", openHistoryButtonHandler)

function openHistoryButtonHandler(e) {
    //Toggle history variable
    historyOpen = !historyOpen

    //If historyOpen was just set to false, close the history
    if (!historyOpen) {
        let child = chatHistory.lastElementChild;
        e.target.innerHTML = "Chat History ⯈"

        //remove all chat history tags to close it (e.target part checks if it's the button you click on)
        while (child && child !== e.target) {
            chatHistory.removeChild(child);
            child = chatHistory.lastElementChild;
        }
    }
    //Else open the history and load all history from localstorage
    else {
        const localStorageHistory = JSON.parse(localStorage.getItem("chat-history")) ?? ""
        e.target.innerText = "Chat History ⯆"

        //Check for empty local storage beforehand
        if (localStorageHistory === "") {
            const chatHistoryElement = document.createElement("p")
            chatHistoryElement.id = "nomessages"
            chatHistoryElement.className = "mb-4"
            chatHistoryElement.innerText = "No message history found. Talk to the cat, he won't bite!"
            chatHistory.appendChild(chatHistoryElement)
            return
        }

        //Add all chat history messages
        renderHistoryElements(localStorageHistory)
    }
}

function renderHistoryElements(msgHistory) {
    for (let msg of msgHistory) {
        const chatHistoryElement = document.createElement("p")

        //Change the role to You, or Cat based on if it's "user" or "assistant"
        let role
        let nameColor
        if (msg.role === "user") {
            role = "You"
            nameColor = "blue-300"
        } else if (msg.role === "assistant") {
            role = "Cat"
            nameColor = "gray-600"
            chatHistoryElement.className = `mb-4`
        }

        //Create chat history element
        chatHistoryElement.innerHTML = `<span class="text-${nameColor} font-bold">${role}</span>: ${msg.content}`
        chatHistory.appendChild(chatHistoryElement)
    }
}

//function to update history if a new message is added while it's open
export function updateHistory(newMessages) {
    const noMessages = document.getElementById("nomessages")

    //Skip entire function if the history is closed
    if (!historyOpen) {
        return
    }

    //If the nomessages error is still up, remove it
    if (noMessages) {
        document.remove("noMessages")
    }

    //Load the history elements with the 2 new elements.
    //Those 2 elements come from the function at script.js:128
    renderHistoryElements(newMessages)

    const output = document.getElementById("chat-history");
    output.scrollTop = output.scrollHeight;
}