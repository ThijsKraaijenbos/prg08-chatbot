import { AzureChatOpenAI, AzureOpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";


const model = new AzureChatOpenAI({temperature: 1});

const embeddings = new AzureOpenAIEmbeddings({
    temperature: 0,
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME
});

let vectorStore = await FaissStore.load("sillycatdb", embeddings); // dezelfde naam van de directory
//embeddings pakt de const hierboven

async function askQuestion(prompt){
    const relevantDocs = await vectorStore.similaritySearch(prompt,3);
    const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");
    const response = await model.invoke([
        ["system", "Use the following context to answer the user's question. Only use information from the context."],
        ["user", `Context: ${context}\n\nQuestion: ${prompt}`]
    ]);
    return response.content
}

await askQuestion("what was inside the fridge")