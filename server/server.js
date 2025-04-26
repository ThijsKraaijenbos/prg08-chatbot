import {AzureChatOpenAI, AzureOpenAIEmbeddings} from "@langchain/openai";
import {HumanMessage, AIMessage, SystemMessage, ToolMessage} from "@langchain/core/messages";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import express from "express";
import cors from "cors"

const model = new AzureChatOpenAI({temperature: 1});

const embeddings = new AzureOpenAIEmbeddings({
    temperature: 0,
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME
});

let vectorStore = await FaissStore.load("sillycatdb", embeddings); // dezelfde naam van de directory
//embeddings pakt de const hierboven

const app = express()
app.use(cors());
app.use(express.json()); // for application/json
app.use(express.urlencoded({extended: true})); // for application/x-www-form-urlencoded


app.post("/ask", async (req, res) => {
    try {
        let prompt = req.body.prompt
        const history = req.body.history || [];
        let endresult = ""

        const relevantDocs = await vectorStore.similaritySearch(prompt, 3);
        const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");

        //ai system settings
        const messages = [
            new SystemMessage(
                `You are a friendly talking cat. 
            You are very smart and quite sassy. 
            You give silly, funny, and helpful answers with a lot of sass,
            and sometimes talk about cat things like naps, tuna, lasers, or knocking cups off tables. 
            Occasionally end some answers with meow, or purr. 
            Your grammar is quite good, make sure to use punctuation.
            Make sure to only do that with like a 1/2 chance. 
            Otherwise don't end it with meow or purr. 
            Also make sure that all your answers are kept very short but still convey your message.
            Make sure to add an emotion to the end of your your entire response (not at the end of a sentence). 
            IMPORTANT: ALWAYS return one of the following ones in this format *emotion*
            [angry, blush, cheeky, calm, dizzy, eating, evil_grin, happy, injured, love, shocked, smirk, sparkling, squint, tired].
            Before you finish your response make sure to double check that the emotion is in this array. Try to vary your emotes as much as possible.
            `)
        ]

        //load any messages that are sent from the client's localstorage
        for (let msg of history) {
            if (msg.role === "user") {
                messages.push(new HumanMessage(msg.content));
            } else if (msg.role === "assistant") {
                messages.push(new AIMessage(msg.content));
            }
        }

        //add the current prompt
        messages.push(
            new HumanMessage(`Context: ${context}\n\nQuestion: ${prompt}`)
        )

        console.log(messages)
        console.log("---------------------")
        //stream response
        const stream = await model.stream(messages);
        res.setHeader("Content-Type", "text/plain");
        for await (const chunk of stream) {
            endresult += chunk?.content
            res.write(chunk?.content)
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay between chunks
        }
        res.end();
    } catch (e) {
        //Stream error message
        res.setHeader("Content-Type", "text/plain");
        const errorMessage = "I'm sorry, I can't help you with that...";
        //Split the string into chunks to make it look more like a stream that the model would return
        //Makes sure that spaces are split, but are kept after each word, also splits the 3 dots at the end
        const chunks = errorMessage.match(/[^.\s,]+(?:[ ,]+)?|\./g);

        for (let chunk of chunks) {
            res.write(`${chunk}`);
            await new Promise(resolve => setTimeout(resolve, 1)); // Slower typing for error
        }

        res.end();
    }
})

app.listen(3000, () => console.log("server op poort 3000"))