export async function apiCall() {
    try {
        const response = await fetch("https://meme-api.com/gimme", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return await response.json();
    } catch (e) {
        console.log("Error fetching meme:", e);
        return null;
    }
}
