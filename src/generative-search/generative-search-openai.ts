import weaviate, { ApiKey, WeaviateClient } from 'weaviate-ts-client';
import axios from 'axios';

  // let's instantiate Weaviate client
  

// Step 1) Connect to Weaviate 
// Update your connection details for your WCS cluster
const client: WeaviateClient = weaviate.client({
  scheme: 'https',
  host: 'some-endpoint.weaviate.network',  // Replace with your endpoint
  apiKey: new ApiKey('YOUR-WEAVIATE-API-KEY'),  // Replace w/ your Weaviate instance API key
  headers: { 'X-OpenAI-Api-Key': 'YOUR-OPENAI-API-KEY' },  // Replace with your inference API key
});

// Alternatively, use the below code if you use Weavite with Docker 
// const client: WeaviateClient = weaviate.client({
//     scheme: 'http',
//     host: 'localhost:8080',
//     headers: { 'X-OpenAI-Api-Key': 'YOUR-OPENAI-API-KEY' },
// });

// Step 2 – create a new collection for your data and vectors
async function createCollection() {
  // Define collection configuration - vectorizer, generative module and data schema
  const schema_definition = {
    class: 'JeopardyQuestion',
    description: 'List of jeopardy questions',
    vectorizer: 'text2vec-openai',
    moduleConfig: {
      'generative-openai': {
        'model': 'gpt-3.5-turbo',  // Optional - Defaults to `gpt-3.5-turbo`
      }
    },
    properties: [
      {
        name: 'Category',
        dataType: ['text'],
        description: 'Category of the question',
      },
      {
        name: 'Question',
        dataType: ['text'],
        description: 'The question',
      },
      {
        name: 'Answer',
        dataType: ['text'],
        description: 'The answer',
      }
    ]
  }
  // let's create it
  let new_class = await client.schema.classCreator().withClass(schema_definition).do()
  
  console.log('We have a new class!', new_class['class'])
}

// Step 3 – import data into your collection
async function importData() {
  // now is time to import some data
  // first, let's grab our Jeopardy Questions from the interwebs
  
  const url = 'https://raw.githubusercontent.com/weaviate/weaviate-examples/main/jeopardy_small_dataset/jeopardy_tiny.json'
  const jeopardy_questions = await axios.get(url)

  let counter = 0;
  let batcher = client.batch.objectsBatcher();

  for (const dataObj of jeopardy_questions.data) {
    batcher = batcher.withObject({
      class: 'JeopardyQuestion',
      properties: dataObj,
      // tenant: 'tenantA'  // If multi-tenancy is enabled, specify the tenant to which the object will be added.
    });

    // push a batch of 5 objects
    if (++counter > 4) {
      await batcher.do();
      batcher = client.batch.objectsBatcher();
      counter = 0;
    }
  }

  // push the remaining batch of objects
  if (counter>0) {
    await batcher.do();
  }

  console.log('Data Imported');
}

// Step 4 – run RAG query with single prompt
async function singlePrompt(query: string, prompt: string) {
  const singlePrompt = await client.graphql.get()
    .withClassName('JeopardyQuestion')
    .withFields('question category')
    .withNearText({
      concepts: [query],
    })
    .withGenerate({
      singlePrompt: prompt,
    })
    .withLimit(2)
    .do();

  console.log('Single Prompt response:', JSON.stringify(singlePrompt, null, 2))
}



async function runFullExample() {
  // uncomment this code if you want to force recreating the collection
  // await deleteCollection();

  if(await collectionExists() == false) {
    await createCollection();
    await importData();
  }

  await singlePrompt('Elephants', 'Turn the following Jeopardy question into a Facebook Ad: {question}.');
}

runFullExample().then()

// ------------------------- Helper functions

// Helper function to check if collection exists
async function collectionExists() {
  return client.schema.exists('JeopardyQuestion')
}

// Helper function to delete the collection
async function deleteCollection() {
  // Delete the collection if it already exists
  if(await collectionExists()) {
    console.log('DELETING')
    await client.schema.classDeleter().withClassName('JeopardyQuestion').do();
  }
}