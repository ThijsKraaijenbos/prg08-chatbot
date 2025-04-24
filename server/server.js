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
        Make sure to add an emotion to the end of your message. IMPORTANT: ALWAYS return one of the following ones in this format *emotion*
        [angry, blush, cheeky, calm, dizzy, eating, evil_grin, happy, injured, love, shocked, smirk, sparkling, squint, tired].
        Before you finish your response make sure to double check that the emotion is in this array. Try not to respond with Cheeky all the time though.
        `
    )
]

app.post("/ask", async (req, res) => {
    let prompt = req.body.prompt
    let endresult = ""

    const relevantDocs = await vectorStore.similaritySearch(prompt,3);
    const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");

    messages.push(
        new HumanMessage(`Context: ${context}\n\nQuestion: ${prompt}`)
    )

    const stream = await model.stream(messages);
    res.setHeader("Content-Type", "text/plain");
    for await (const chunk of stream) {
        endresult += chunk?.content
        res.write(chunk?.content)
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay between chunks
    }
    res.end();

    messages.push(
        new AIMessage(endresult)
    )
})

app.listen(3000, () => console.log("server op poort 3000"))