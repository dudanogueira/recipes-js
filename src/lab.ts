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
  return "Script Finished!"
}
const execute = Do().then(console.log)

