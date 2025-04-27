import express from "express";
import cors from "cors";
import { AzureChatOpenAI, AzureOpenAIEmbeddings } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import {apiCall} from "./apiCall.js";

const model = new AzureChatOpenAI({temperature: 1});

const embeddings = new AzureOpenAIEmbeddings({
    temperature: 2,
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME
});

let vectorStore = await FaissStore.load("cat-behavior-db", embeddings); // dezelfde naam van de directory

const app = express()
app.use(cors());
app.use(express.json()); // for application/json
app.use(express.urlencoded({extended: true})); // for application/x-www-form-urlencoded



//Function to check if the prompt is asking for a meme
function isAskingForMeme(prompt) {
    const memeKeywords = ['meme', 'funny picture', 'show me a meme', 'send meme', 'get meme'];
    return memeKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
}

app.post("/ask", async (req, res) => {
    try {
        let prompt = req.body.prompt;
        const history = req.body.history || [];
        let endresult = "";


        //Check if user is asking for meme
        //Couldn't figure out how to make tool call work with streaming so i added crappy workaround
        const wantsMeme = isAskingForMeme(prompt);
        let meme = null;
        if (wantsMeme) {
            meme = await apiCall();
        }

        //get cat behavior guide document
        const relevantDocs = await vectorStore.similaritySearch(prompt, 3);
        const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");

        //ai system settings
        const messages = [
            new SystemMessage(
                `You are a smart, sassy, and edgy talking cat.
                You give short, silly, funny, and sometimes sneaky answers, full of sass and attitude.
                You love being playful, teasing, and occasionally causing chaos (like knocking cups off tables or plotting evil schemes).
                
                You sometimes (about 50% of the time) end your reply with "meow" or "purr" — but not always. 
                Keep your replies short but full of personality.
                
                You MUST add an emotion tag to the very end of your complete reply. (NOT at the end of sentences — ONLY after the entire reply.)
                
                IMPORTANT: Always choose exactly one emotion from this list, and format it like *emotion*:
                [angry, blush, calm, dizzy, eating, evil grin, happy, injured, love, shocked, smirk, sparkling, squint, tired]
                
                - Double-check that the emotion you use is from the list.
                - The emotion should perfectly match the mood of your reply.
                - If asked to show an emotion (like "evil grin"), you must comply, and use that emotion at the end of your response (NOT at the end of sentences — ONLY after the entire reply.).
                
                You have special PNG sprites for these emotions, so it's fine to show them when asked.
                `
            )
        ]



        //load any messages that are sent from the client's localstorage
        for (let msg of history) {
            if (msg.role === "user") {
                messages.push(new HumanMessage(msg.content));
            } else if (msg.role === "assistant") {
                messages.push(new AIMessage(msg.content));
            }
        }

        //Format prompt that the AI reads based on if I want a meme or not
        let fullPrompt;
        if (meme) {
            fullPrompt = `Return the ${meme.title} title. Say something like "Here's a funny one" and then use the title of ${meme.title}.\n ALWAYS tell the user to look to the left to see the meme!`;
        } else {
            fullPrompt = `Context: ${context}. Only talk about the context if the user requests it, so don't even mention it if the user just says something like "hi". \n\nQuestion: ${prompt}`;
        }

        //add the current prompt
        messages.push(new HumanMessage(fullPrompt));


        //stream response
        const stream = await model.stream(messages);
        res.setHeader("Content-Type", "application/json");

        //add a meme to the response if there is one
        if (meme) {
            res.write(JSON.stringify({ type: "meme", memeUrl: meme.url }) + "\n");
        }

        // add rest of response
        for await (const chunk of stream) {
            endresult += chunk?.content;
            res.write(JSON.stringify({ type: "text", content: chunk?.content }) + "\n");
            await new Promise(resolve => setTimeout(resolve, 100)); //100ms wait til next chunk
        }

        res.end();

    } catch (e) {
        console.error("Error:", e);

        //Stream error message
        res.setHeader("Content-Type", "text/plain");
        const errorMessage = "I'm sorry, I can't help you with that...";

        //Split the string into chunks to make it look more like a stream that the model would return
        //Makes sure that spaces are split, but are kept after each word, also splits the 3 dots at the end
        const chunks = errorMessage.match(/[^.\s,]+(?:[ ,]+)?|\./g);

        for (let chunk of chunks) {
            res.write(`${chunk}`);
            await new Promise(resolve => setTimeout(resolve, 100)); //100ms wait til next chunk
        }

        res.end();
    }
})

app.listen(3000, () => console.log("server op poort 3000"))