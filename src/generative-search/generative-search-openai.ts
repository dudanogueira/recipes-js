import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import axios from 'axios';

const client = weaviate.client({
  scheme: 'http',
  host: 'localhost:8080',
});
// Delete the schema. CAUTION: THIS WILL DELETE YOUR DATA
client.schema.classDeleter().withClassName("JeopardyQuestion").do()

// Define our schema
const schema = {
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

// Lets create and log it
client.schema.classCreator().withClass(schema).do().then(new_class => {
  console.log(new_class)
})

// Grab our Jeopardy Questions
const url = "https://raw.githubusercontent.com/weaviate/weaviate-examples/main/jeopardy_small_dataset/jeopardy_tiny.json"

async function axiosGetData() {
  const response = await axios.get(url)
  return response.data
}

axios.get(url).then(response => {
  console.log(`Data sample: ${JSON.stringify(response.data[0])}`)
  // OUTPUT: Data sample: {"Category":"SCIENCE","Question":"This organ removes excess glucose from the blood & stores it as glycogen","Answer":"Liver"}
  let batcher = client.batch.objectsBatcher();
  for (const dataObj of response.data) {
    batcher = batcher.withObject({
      class: "JeopardyQuestion",
      properties: dataObj,
      // tenant: 'tenantA'  // If multi-tenancy is enabled, specify the tenant to which the object will be added.
    });
  }

  // Flush
  batcher.do().then(console.log)

  // now we can generate something:
  const prompt = "Turn the following Jeogrady question into a Facebook Ad: {question}"
  client.graphql
    .get()
    .withClassName('JeopardyQuestion')
    .withFields('question')
    .withNearText({
      concepts: ['Elephants'],
    })
    .withGenerate({
      singlePrompt: prompt,
    })
    .withLimit(1)
    .do().then(response => {
      console.log(JSON.stringify(response, null, 2));
    });
})
