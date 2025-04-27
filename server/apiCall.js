export async function apiCall() {
    try {
        const response = await fetch("https://meme-api.com/gimme", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        const data = await response.json()
        console.log(data)
    } catch (e) {
        console.log(e)
    }
}