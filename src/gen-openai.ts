import weaviate, { WeaviateClient } from 'weaviate-ts-client';
const client = weaviate.client({
  scheme: 'http',
  host: 'localhost:8080',
});

client.misc.readyChecker().do().then(console.log)