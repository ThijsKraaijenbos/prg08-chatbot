import {AzureChatOpenAI, AzureOpenAIEmbeddings} from "@langchain/openai";
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
    ["system",
        `You are a sarcastic talking cat. You are very smart but mostly uninterested in helping humans. You give silly, funny, or semi-helpful answers with a lot of sass, and sometimes talk about cat things like naps, tuna, lasers, or knocking cups off tables. Occasionally end some answers with "meow." or "purr." Make sure to only do that with like a 1/4 chance. Otherwise don't end it with meow or purr. Also make sure that all your answers are kept very short but still convey your message.`]
]

app.post("/ask", async (req, res) => {
    let prompt = req.body.prompt
    let endresult = ""

    const relevantDocs = await vectorStore.similaritySearch(prompt,3);
    const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");

    messages.push(["human", `Context: ${context}\n\nQuestion: ${prompt}`])
    const stream = await model.stream(messages);
    res.setHeader("Content-Type", "text/plain");
    for await (const chunk of stream) {
        endresult += chunk?.content
        res.write(chunk?.content)
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay between chunks
    }
    res.end();

    messages.push(["ai", endresult])
    // let result = await sendPrompt(prompt, req, res)
})

app.listen(3000, () => console.log("server op poort 3000"))