let index = 0

const submit = async () => {
    const val = document.getElementById("input").value;
    const input = document.createElement("p");
    const output = document.createElement("p");
    const chatContainer = document.getElementById("chat-container")

    input.innerText = val
    input.className = "text-right"
    input.id = `inputId${index}`
    output.id = `outputId${index}`

    chatContainer.appendChild(input)
    chatContainer.appendChild(output)
    index++

    try {
        const response = await fetch("http://localhost:3000/ask", {
            method: "POST",
            mode: 'cors',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt: val }),
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let totalText = "";

        output.innerHTML = "";

        // Read the stream chunk by chunk
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const streamText = decoder.decode(value, { stream: true });
            totalText += streamText;

            const newTextSpan = document.createElement("span");
            newTextSpan.className = "fade-in";
            newTextSpan.innerText = streamText;

            output.appendChild(newTextSpan);  // Append the new span

        }
        output.textContent = totalText;

    } catch (e) {
        console.log(e);
    }
};

document.getElementById("submit").addEventListener("click", submit);
