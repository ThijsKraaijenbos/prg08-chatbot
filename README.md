**Installation:**

- Clone the project. <br>

- In terminal, run the following commands: <br>
`cd server` <br>
`npm install` <br>

Then you'll need to create an ENV file in the /server directory with the following variables.<br>

```
AZURE_OPENAI_API_VERSION
AZURE_OPENAI_API_INSTANCE_NAME
AZURE_OPENAI_API_KEY
AZURE_OPENAI_API_DEPLOYMENT_NAME
AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME
```

Because this is an ENV file, it obviously contains sensitive information such as an API key.
Therefor you should create one yourself, and insert your own values.

After you've done that, run the following command in the terminal (make sure you're still in the /server directory!)<br>
`npm run env` 


When that's done, you can go to `client/index.html` and run this through something like your IDE's live editor, or through VSCode live server.
(not 100% sure if VSCode live server works, but probably will)