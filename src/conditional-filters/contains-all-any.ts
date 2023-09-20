import weaviate, { ApiKey, ConnectionParams, WeaviateClient } from 'weaviate-ts-client';
require('dotenv').config();


// TODO: can we make the client connection simpler?
// This looks more complicated than it should be :p

// Step 1) Connect to Weaviate 
// If you want to use WCS, define the environment variables
const connection_config: ConnectionParams = {
    scheme: process.env.WEAVIATE_SCHEME_URL || 'http',
    host: process.env.WEAVIATE_URL || 'localhost:8080',
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
    let data = [
        { "question": "question with tags A, B and C", "tags": ["tagA", "tagB", "tagC"], "wordCount": 2000 },
        { "question": "question with tags B and C", "tags": ["tagB", "tagC"], "wordCount": 1001 },
        { "question": "question with tags A and C", "tags": ["tagA", "tagC"], "wordCount": 500 }
    ]

    let batcher = client.batch.objectsBatcher();

    for (const dataObj of data) {
        batcher = batcher.withObject({
            class: 'Document',
            properties: dataObj,
        });
    }
    // insert batched objects
    await batcher.do();

    console.log('Data Imported');
}

// Step 4 – run a ContainsAll query
async function searchAllTags(tags: string[]) {
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

async function searchAnyTags(tags: string[]) {
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

// Step 5 - run the full example
async function runFullExample() {
    // comment this the line bellow if you don't want your class to be deleted each time.
    // await deleteCollection();

    if (await collectionExists() == false) {
        await createCollection();
        await importData();
    }

    // ContainsAll examples
    const docs_tags_bc = await searchAllTags(["tagB", "tagC"]);
    console.log("Docs that contains ALL provided tags: tags tagB and tagC:", JSON.stringify(docs_tags_bc, null, 2))
    
    const docs_tags_ac = await searchAllTags(["tagA", "tagC"]);
    console.log("Docs that contains ALL provided tags: tagA and tagC:", JSON.stringify(docs_tags_ac, null, 2))
    
    const docs_tags_ad = await searchAllTags(["tagA", "tagD"]);
    // this will return an empty response, as there is no document with tagD
    console.log("Docs that contains ALL provided tags: tagA and tagD:", JSON.stringify(docs_tags_ad, null, 2))
    
    // ContainsAny example
    const docs_tags_AW = await searchAnyTags(["tagA", "tagW"]);
    console.log("Docs that contains ANY of the tags: tagA and tagW:", JSON.stringify(docs_tags_AW, null, 2))
}

runFullExample()

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