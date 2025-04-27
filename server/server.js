import express from "express";
import cors from "cors";
import { AzureChatOpenAI, AzureOpenAIEmbeddings } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

// recreate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for required environment variables
const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const chatDeploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const embeddingsDeploymentName = process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME;

// Initialize model and embeddings if credentials are available
let model;
let embeddings;
let vectorStore;

try {
    if (!azureApiKey || !azureEndpoint || !chatDeploymentName) {
        console.warn("Missing required Azure OpenAI credentials for chat model.");
    } else {
        model = new AzureChatOpenAI({
            temperature: 1,
            azureOpenAIApiKey: azureApiKey,
            azureOpenAIEndpoint: azureEndpoint,
            deploymentName: chatDeploymentName
        });
        console.log("Chat model initialized successfully");
    }

    if (!azureApiKey || !azureEndpoint || !embeddingsDeploymentName) {
        console.warn("Missing required Azure OpenAI credentials for embeddings.");
    } else {
        embeddings = new AzureOpenAIEmbeddings({
            temperature: 0,
            azureOpenAIApiKey: azureApiKey,
            azureOpenAIEndpoint: azureEndpoint,
            azureOpenAIApiEmbeddingsDeploymentName: embeddingsDeploymentName
        });
        console.log("Embeddings initialized successfully");
    }

    // Only try to load the vector store if embeddings are available
    if (embeddings) {
        try {
            vectorStore = await FaissStore.load("sillycatdb", embeddings);
            console.log("Vector store loaded successfully");
        } catch (error) {
            console.error("Error loading vector store:", error);
        }
    }
} catch (error) {
    console.error("Error initializing Azure OpenAI services:", error);
}

const app = express();
app.use(cors());
app.use(express.json()); // for application/json
app.use(express.urlencoded({extended: true})); // for application/x-www-form-urlencoded

// Serve static files from the 'client' directory
app.use(express.static(path.join(__dirname, '../client')));

// Define the root route to serve the index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

app.post("/ask", async (req, res) => {
    try {
        // Check if model and vector store are available
        if (!model || !vectorStore) {
            throw new Error("Azure OpenAI services not properly initialized");
        }

        let prompt = req.body.prompt;
        const history = req.body.history || [];
        let endresult = "";

        const relevantDocs = await vectorStore.similaritySearch(prompt, 3);
        const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");

        // AI system settings
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
        ];

        // Load any messages from client's localstorage
        for (let msg of history) {
            if (msg.role === "user") {
                messages.push(new HumanMessage(msg.content));
            } else if (msg.role === "assistant") {
                messages.push(new AIMessage(msg.content));
            }
        }

        // Add the current prompt
        messages.push(
            new HumanMessage(`Context: ${context}\n\nQuestion: ${prompt}`)
        );

        console.log(messages);
        console.log("---------------------");

        // Stream response
        const stream = await model.stream(messages);
        res.setHeader("Content-Type", "text/plain");
        for await (const chunk of stream) {
            endresult += chunk?.content;
            res.write(chunk?.content);
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay between chunks
        }
        res.end();
    } catch (e) {
        console.error("Error processing request:", e);

        // Stream error message
        res.setHeader("Content-Type", "text/plain");
        const errorMessage = "I'm sorry, I can't help you with that...";
        // Split the string into chunks to make it look more like a stream
        const chunks = errorMessage.match(/[^.\s,]+(?:[ ,]+)?|\./g);

        for (let chunk of chunks) {
            res.write(`${chunk}`);
            await new Promise(resolve => setTimeout(resolve, 1)); // Slower typing for error
        }
        res.end();
    }
});

// Check environment and conditionally start the server
if (process.env.NODE_ENV === 'production') {
    console.log("Production build completed successfully");
    // In production, we don't start the server during the build process
    // The server will be started after deployment
} else {
    // In development mode, start the server
    app.listen(3000, () => console.log("server running on port 3000"));
}

export default app; // Export for testing or serverless functions