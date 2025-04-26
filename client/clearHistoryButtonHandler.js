const clearButton = document.getElementById("clear-button")
clearButton.addEventListener("click", clearHistory)

function clearHistory() {
    localStorage.removeItem("chat-history")
}