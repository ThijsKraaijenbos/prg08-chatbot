const historyButton = document.getElementById("history-button")
const chatHistory = document.getElementById("chat-history")
const clearButton = document.getElementById("clear-button")
clearButton.addEventListener("click", clearHistory)

//Clear chat history
function clearHistory() {
    const confirmClear = confirm("Are you sure you want to clear chat history?")
    if (confirmClear) {
        localStorage.removeItem("chat-history")
        let child = chatHistory.lastElementChild;

        //remove all chat history elements (historybutton part checks if it's not the button itself)
        while (child && child !== historyButton) {
            chatHistory.removeChild(child);
            child = chatHistory.lastElementChild;
        }
    alert("Cleared history!")
    }
}