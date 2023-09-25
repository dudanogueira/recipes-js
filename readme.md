# Weaviate JS Recipes

## 1. Install npm packages
Clone this repository, and install dependencies:

```
npm install
```
## 2. Choose where to run Weaviate

### 2.1 Run in Weaviate Cloud Service

Head to [WCS](https://console.weaviate.cloud/), where you can easily create a free sandbox cluster. 
Take note of your `cluster url` and `apiKey`

### 2.2 Run locally using Docker
Considering you already have docker installed, you can run:
```
docker compose up -d
``` 
**IMPORTANT:** make sure to define the environment variables before runnig docker

## 3. Define environment variables
[get your OPENAI key here](https://platform.openai.com/account/api-keys)

[get your COHERE key here](https://dashboard.cohere.com/api-keys)

```
cp .env_example .env
```

If you are using docker, you can keep it like:
```
WEAVIATE_SCHEME_URL=http
WEAVIATE_URL=localhost:8080
OPENAI_APIKEY=<your openai apikey>
COHERE_APIKEY=<your cohere apikey>
```
if you are using WCS, you can keep it like:

```
WEAVIATE_SCHEME_URL=https
WEAVIATE_URL=<yourcluster.weaviate.network>
WEAVIATE_API_KEY=<your_apikey>
OPENAI_APIKEY=<your openai apikey>
COHERE_APIKEY=<your cohere apikey>
```

## 4. Run a Recipe!

```
npm run <recipe>
```

current available recipes:

- `npm run generative-search/openai`
- `npm run generative-search/cohere`
- `npm run similarity-search/text2vec/openai`
- `npm run conditional-filters/containsany-all-any`
- `npm run multi-tenancy/example`
- _more coming soon!_
