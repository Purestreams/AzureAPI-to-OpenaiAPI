const express = require('express');
const cors = require('cors');
const axios = require('axios');
const e = require('express');

// Initialize Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS for all routes. This will handle OPTIONS pre-flight requests.
app.use(cors());

// Get Azure OpenAI Service configuration from environment variables
// In a production environment, these should be set as environment variables.
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || ""; // Set your Azure OpenAI endpoint here
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || ""; // Set your Azure OpenAI API key here

// Different models may require different API versions, be careful to set the correct one
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || "2024-12-01-preview";

const private_password = process.env.PRIVATE_PASSWORD || ""; // Set your private password here

// Check for required configuration
if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
    console.error("Missing one or more required environment variables: AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT");
    process.exit(1);
}

app.get('/v1/models', (req, res) => {
    const authHeader = req.headers.authorization;

    // No authorization is needed for this endpoint

    // Define the models existing in the Azure Service
    const modelsResponse = {
        "object": "list",
        "data": [
            {
                "id": "Phi-4",
                "object": "model",
                "created": 1686935002,
                "owned_by": "Microsoft"
            },
            {
                "id": "gpt-4.1-nano",
                "object": "model",
                "created": 1686935002,
                "owned_by": "openai"
            },
            {
                "id": "o4-mini",
                "object": "model",
                "created": 1686935002,
                "owned_by": "openai"
            }
        ]
    };

    res.json(modelsResponse);
});


app.post('/v1/chat/completions', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${private_password}`) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const requestData = req.body;
        const requestedModel = requestData.model;
        
        // Model mapping - map OpenAI model names to Azure deployment names
        const modelMapping = {
            "gpt-4.1-nano": "gpt-4.1-nano",
            "Phi-4": "phi-4", // Replace with your actual Phi-4 deployment name
            "o4-mini": "o4-mini" // Replace with your actual o4-mini deployment name
        };
        
        // Choose deployment based on requested model, fallback to Phi-4
        let selectedDeployment = modelMapping[requestedModel];
        // Set fallback model or if you want to return an error if the model is not found
        if (!selectedDeployment) {
            console.log(`Model ${requestedModel} not found, falling back to Phi-4`);
            selectedDeployment = modelMapping["Phi-4"];
        } else {
            console.log(`Using deployment: ${selectedDeployment}`);
        }

        const azureUrl = 
            `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${selectedDeployment}` +
            `/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;

        const headers = {
            'Content-Type': 'application/json',
            'api-key': AZURE_OPENAI_API_KEY
        };

        // Set the model to the selected deployment name for Azure
        requestData.model = selectedDeployment;

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
        
        // If there's an error with the selected model, try fallback to Phi-4
        if (error.response && error.response.status === 404) {
            console.log(`Deployment not found, retrying with Phi-4 fallback`);
            try {
                const fallbackUrl = 
                    `${AZURE_OPENAI_ENDPOINT}/openai/deployments/phi-4-deployment` +
                    `/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;
                
                const fallbackData = { ...req.body, model: "phi-4-deployment" };
                
                const fallbackResponse = await axios.post(fallbackUrl, fallbackData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': AZURE_OPENAI_API_KEY
                    },
                    responseType: fallbackData.stream ? 'stream' : 'json'
                });
                
                if (fallbackData.stream) {
                    res.setHeader('Content-Type', fallbackResponse.headers['content-type']);
                    fallbackResponse.data.pipe(res);
                } else {
                    res.json(fallbackResponse.data);
                }
                return;
            } catch (fallbackError) {
                console.error(`Fallback also failed: ${fallbackError}`);
            }
        }
        
        if (error.response) {
            res.status(error.response.status).send(error.response.data);
        } else if (error.request) {
            res.status(503).json({ error: "Failed to connect to Azure OpenAI Service." });
        } else {
            res.status(500).json({ error: "An internal server error occurred." });
        }
    }
});

const PORT = process.env.PORT || 5005;
// Set it to 127.0.0.1 if you want to restrict access to localhost only
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
