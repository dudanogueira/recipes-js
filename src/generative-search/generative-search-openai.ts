import weaviate from 'weaviate-ts-client';
import axios from 'axios';

async function Do() {

  // lets instantiate Weaviate client
  const client = weaviate.client({
    scheme: 'http',
    host: 'localhost:8080',
    //
    // You can specify OPENAI-API-KEY both here or in the environment variable
    // in our case, we already defined it in docker-compose.yml, so no need here
    //
    //   headers: { 'X-OpenAI-Api-Key': 'YOUR-OPENAI-API-KEY' },
  });

  //
  // if you are running in WCS (Weaviate Cloud Service), you can use as bellow:
  //
  // const client: WeaviateClient = weaviate.client({
  //   scheme: 'https',
  //   host: 'some-endpoint.weaviate.network',  // Replace with your endpoint
  //   apiKey: new ApiKey('YOUR-WEAVIATE-API-KEY'),  // Replace w/ your Weaviate instance API key
  //   headers: { 'X-OpenAI-Api-Key': 'YOUR-OPENAI-API-KEY' },  // Replace with your inference API key
  // });

  // First, let's check if our class exists, so we can remove it and create a brand new
  try {
    let class_exists = await client.schema.classGetter().withClassName("JeopardyQuestion").do()
    console.log("class found!")
    // lets delete it
    let delete_class = await client.schema.classDeleter().withClassName("JeopardyQuestion").do()
    console.log("class deleted")
  } catch (e) {
    console.log("No class found.")
  }
  // this is our schema definition
  // Define our schema
  const schema_definition = {
    "class": "JeopardyQuestion",
    "description": "List of jeopardy questions",
    "vectorizer": "text2vec-openai",
    "moduleConfig": {
      "generative-openai": {
        "model": "gpt-3.5-turbo",  // Optional - Defaults to `gpt-3.5-turbo`
      }
    },
    "properties": [
      {
        "name": "Category",
        "dataType": ["text"],
        "description": "Category of the question",
      },
      {
        "name": "Question",
        "dataType": ["text"],
        "description": "The question",
      },
      {
        "name": "Answer",
        "dataType": ["text"],
        "description": "The answer",
      }
    ]
  }
  // lets create it
  let new_class = await client.schema.classCreator().withClass(schema_definition).do()
  console.log("We have a new class!", new_class["class"])

  // now is time to import some data
  // first, lets grab our Jeopardy Questions from the interwebs
  const url = "https://raw.githubusercontent.com/weaviate/weaviate-examples/main/jeopardy_small_dataset/jeopardy_tiny.json"
  const jeopardy_questions = await axios.get(url)
  // this is our data sample
  console.log(`Data sample: ${JSON.stringify(jeopardy_questions.data[0])}`)
  // {"Category":"SCIENCE","Question":"This organ removes excess glucose from the blood & stores it as glycogen","Answer":"Liver"}
  let batcher = client.batch.objectsBatcher();
  for (const dataObj of jeopardy_questions.data) {
    batcher = batcher.withObject({
      class: "JeopardyQuestion",
      properties: dataObj,
      // tenant: 'tenantA'  // If multi-tenancy is enabled, specify the tenant to which the object will be added.
    });
    batcher.do();
  }

  // now we can generate something from each of the results:
  const prompt = "Turn the following Jeopardy question into a Facebook Ad: {question}."
  const singlePrompt = await client.graphql
    .get()
    .withClassName('JeopardyQuestion')
    .withFields('question category')
    .withNearText({
      concepts: ['Elephants'],
    })
    .withGenerate({
      singlePrompt: prompt,
    })
    .withLimit(1)
    .do();  
  console.log("Single Prompt response:", JSON.stringify(singlePrompt, null, 2))
  return "Script Finished!"
}

const execute = Do().then(console.log)

