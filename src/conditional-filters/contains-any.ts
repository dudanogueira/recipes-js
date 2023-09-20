import weaviate, { ApiKey, ConnectionParams, WeaviateClient } from 'weaviate-ts-client';
import axios from 'axios';
require('dotenv').config();

// Step 1) Connect to Weaviate 
// If you want to use WCS, define the environment variables
var connection_config: ConnectionParams = {
    scheme: process.env.WEAVIATE_SCHEME_URL || 'http',
    host: process.env.WEAVIATE_URL || 'localhost:8080',
    headers: { 'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY },  // Replace with your inference API key
}
if (process.env.WEAVIATE_API_KEY) {
    connection_config["apiKey"] = new ApiKey(process.env.WEAVIATE_API_KEY)  // Replace w/ your Weaviate instance API key;
}

console.log("Connecting with:", connection_config)
const client: WeaviateClient = weaviate.client(connection_config);

// Step 2 – create a new collection for your data and vectors
async function createCollection() {
    // Define collection configuration.
    const schema_definition = {
        "class": "Document",
        "vectorizer": "none",
        "properties": [
            {
                "name": "question",
                "dataType": ["text"]
            },
            {
                "name": "tags",
                "dataType": ["text[]"] // a list of texts
            }
        ],
    }
    // let's create it
    let new_class = await client.schema.classCreator().withClass(schema_definition).do()
    console.log('We have a new class!', new_class['class'])
}

// Step 3 – import data into your collection
async function importData() {
    // now is time to import some data
    // first, let's grab our Jeopardy Questions from the interwebs

    let data = [
        { "question": "question with tag A, B and C", "tags": ["tagA", "tagB", "tagC"], "wordCount": 2000 },
        { "question": "question with tags B and C", "tags": ["tagB", "tagC"], "wordCount": 1001 },
        { "question": "question with tags A and C", "tags": ["tagA", "tagC"], "wordCount": 500 }
    ]

    let counter = 0;
    let batcher = client.batch.objectsBatcher();

    for (const dataObj of data) {
        batcher = batcher.withObject({
            class: 'Document',
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
    if (counter > 0) {
        await batcher.do();
    }

    console.log('Data Imported');
}

// Step 4 – run a ContainsAll query
async function searchTags(tags: string[]) {
    return client.graphql
        .get()
        .withClassName("Document")
        .withFields("question tags")
        .withWhere({
            operator: 'ContainsAny',
            path: ["tags"],
            valueTextArray: tags,
        }).do();
}
async function runFullExample() {
    // comment this the line bellow dont want your class to be deleted.
    await deleteCollection();

    if (await collectionExists() == false) {
        await createCollection();
        await importData();
    }

    const docs_tags_AW = await searchTags(["tagA", "tagW"]);
    // note that, if we were using ContainsAll, this query would result in an empty result
    console.log("Docs that contains ANY of the tags: tagA and tagW:", JSON.stringify(docs_tags_AW, null, 2))
}

runFullExample().then()

// ------------------------- Helper functions

// Helper function to check if collection exists
async function collectionExists() {
    return client.schema.exists('Document')
}

// Helper function to delete the collection
async function deleteCollection() {
    // Delete the collection if it already exists
    if (await collectionExists()) {
        console.log('DELETING')
        await client.schema.classDeleter().withClassName('Document').do();
    }
}