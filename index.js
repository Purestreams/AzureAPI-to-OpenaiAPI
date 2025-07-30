const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Initialize Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS for all routes. This will handle OPTIONS pre-flight requests.
app.use(cors());

// Get Azure OpenAI Service configuration from environment variables
// In a production environment, these should be set as environment variables.

// Check for required configuration
if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY || !AZURE_OPENAI_DEPLOYMENT) {
    console.error("Missing one or more required environment variables: AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT");
    process.exit(1);
}

app.post('/v1/chat/completions', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${private_password}`) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const requestData = req.body;

        const azureUrl = 
            `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}` +
            `/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;

        const headers = {
            'Content-Type': 'application/json',
            'api-key': AZURE_OPENAI_API_KEY
        };

        // The 'model' parameter in the OpenAI request body should be mapped to the deployment.
        // Azure's API uses the deployment name from the URL.
        requestData.model = AZURE_OPENAI_DEPLOYMENT;

        const isStream = requestData.stream || false;

        const response = await axios.post(azureUrl, requestData, {
            headers: headers,
            responseType: isStream ? 'stream' : 'json'
        });

        if (isStream) {
            res.setHeader('Content-Type', response.headers['content-type']);
            response.data.pipe(res);
        } else {
            res.json(response.data);
        }

    } catch (error) {
        console.error(`An error occurred: ${error}`);
        if (error.response) {
            // Forward the error from Azure service
            res.status(error.response.status).send(error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            res.status(503).json({ error: "Failed to connect to Azure OpenAI Service." });
        } else {
            // Something happened in setting up the request that triggered an Error
            res.status(500).json({ error: "An internal server error occurred." });
        }
    }
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
