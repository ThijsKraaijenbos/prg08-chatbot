let historyOpen = false
const chatHistory = document.getElementById("chat-history")
const historyButton = document.getElementById("history-button")
historyButton.addEventListener("click", openHistoryButtonHandler)

export default function openHistoryButtonHandler(e) {
    historyOpen = !historyOpen
    if (!historyOpen) {
        let child = chatHistory.lastElementChild;
        e.target.innerHTML = "Chat History ⯈"

        //remove all chat history tags to close it (e.target part checks if it's the button you click on)
        while (child && child !== e.target) {
            chatHistory.removeChild(child);
            child = chatHistory.lastElementChild;
        }
    } else {
        const localStorageHistory = JSON.parse(localStorage.getItem("chat-history")) ?? ""
        e.target.innerText = "Chat History ⯆"

        for (let msg of localStorageHistory) {
            //Change the role to You, or Cat based on if it's "user" or "assistant"
            let role
            let nameColor
            let mb
            if (msg.role === "user") {
                role = "You"
                nameColor = "blue-300"
            } else if (msg.role === "assistant") {
                role = "Cat"
                nameColor = "gray-600"
                mb = "4"
            }

            const chatHistoryInput = document.createElement("p")
            mb ? chatHistoryInput.className = `mb-${mb}` : ""
            chatHistoryInput.innerHTML = `<span class="text-${nameColor} font-bold">${role}</span>: ${msg.content}`
            chatHistory.appendChild(chatHistoryInput)
        }
    }
}