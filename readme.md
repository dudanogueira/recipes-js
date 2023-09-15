# Weaviate JS Recipes

## 1. Install npm packages
Clone this repository, and install dependencies:

```
npm install
```
## 2. Define environment variables
[get your OPENAI key here](https://platform.openai.com/account/api-keys)
```
export $OPENAI_APIKEY=<YOUR-OPENAI-KEY>
```

[get your COHERE key here](https://dashboard.cohere.com/api-keys)
```
export $COHERE_APIKEY=<YOUR-COHERE-KEY>
```

## 4. Run weaviate
You can either run Weaviate locally (using docker compose) or in cloud, using [Weaviate Cloud service](https://console.weaviate.cloud/)

For docker, you can run:
```
docker compose up -d
```

## 4. Run a Recipe!

```
npm run <recipe>
```

current available recipes:

- `npm run generative-search-openai`
- _more coming soon!_
