import { AzureChatOpenAI, AzureOpenAIEmbeddings } from "@langchain/openai";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
// import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

const model = new AzureChatOpenAI({temperature: 1});

const embeddings = new AzureOpenAIEmbeddings({
    temperature: 0,
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME
});
const vectorTest = await embeddings.embedQuery("silly goose")
console.log(vectorTest)

let vectorStore

async function createVectorstore() {
    const loader = new TextLoader("./public/story.txt");
    const docs = await loader.load();
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 300, chunkOverlap: 50 });
    const splitDocs = await textSplitter.splitDocuments(docs);
    console.log(`Document split into ${splitDocs.length} chunks. Now saving into vector store`);
    vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);
    await vectorStore.save("sillycatdb"); // geef hier de naam van de directory waar je de data gaat opslaan
    console.log("vector store created")
}

async function askQuestion(prompt){
    const relevantDocs = await vectorStore.similaritySearch(prompt,3);
    const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");
    const response = await model.invoke([
        ["system", "Use the following context to answer the user's question. Only use information from the context."],
        ["user", `Context: ${context}\n\nQuestion: ${prompt}`]
    ]);
    console.log("\nAnswer found:");
    console.log(response.content);
}


await createVectorstore()
await askQuestion("What is the full name of the main character?")