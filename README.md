# Azure to OpenAI API Proxy

A reverse proxy that translates OpenAI API requests to Azure OpenAI Service, allowing you to use Azure OpenAI models with any OpenAI-compatible client. Available in both **Python (Flask)** and **Node.js (Express)** implementations.

## Features

- **OpenAI API Compatibility**: Accepts standard OpenAI API requests and forwards them to Azure OpenAI Service
- **Streaming Support**: Full support for streaming chat completions
- **CORS Enabled**: Cross-origin requests supported for web applications
- **Authorization**: Built-in API key authentication for security
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Dual Implementation**: Choose between Python/Flask or Node.js/Express

## Prerequisites

- **For Python version**: Python 3.7 or higher
- **For Node.js version**: Node.js 14 or higher
- Azure OpenAI Service subscription
- Azure OpenAI deployment (e.g., GPT-4, GPT-3.5-turbo)

## Installation

1. Clone this repository:
```bash
git clone https://github.com/Purestreams/AzureAPI-to-OpenaiAPI.git
cd AzureAPI-to-Openai
```

2. Choose your preferred implementation:

### Option A: Python (Flask) Implementation

Install Python dependencies:
```bash
pip install flask flask-cors requests
```

### Option B: Node.js (Express) Implementation

Install Node.js dependencies:
```bash
npm install express cors axios
```

## Configuration

You can configure the proxy using either direct code modification or environment variables (recommended for production).

### Method 1: Environment Variables (Recommended)

Set the following environment variables:

```bash
export AZURE_OPENAI_ENDPOINT="https://your-resource-name.openai.azure.com"
export AZURE_OPENAI_API_KEY="your_azure_openai_api_key_here"
export AZURE_OPENAI_DEPLOYMENT="your-deployment-name"
export AZURE_OPENAI_API_VERSION="2024-05-01-preview"
export PRIVATE_PASSWORD="your_private_password_here"
```

### Method 2: Direct Code Modification

#### For Python (main.py):
```python
# Replace these placeholders with your actual values
AZURE_OPENAI_ENDPOINT = "https://your-resource-name.openai.azure.com"
AZURE_OPENAI_API_KEY = "your_azure_openai_api_key_here"
AZURE_OPENAI_DEPLOYMENT = "your-deployment-name"  # e.g., "gpt-4"
AZURE_OPENAI_API_VERSION = "2024-05-01-preview"
private_password = "your_private_password_here"
```

#### For Node.js (index.js):
The Node.js version uses environment variables by default, but you can modify the fallback values:
```javascript
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || "your-endpoint-here";
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || "your-key-here";
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || "your-deployment-here";
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || "2024-05-01-preview";
const private_password = process.env.PRIVATE_PASSWORD || "your-password-here";
```

### Getting Azure OpenAI Configuration

1. **Endpoint**: Found in the Azure portal under your OpenAI resource → "Keys and Endpoint"
2. **API Key**: Also found in "Keys and Endpoint" section
3. **Deployment Name**: The name you gave to your model deployment in Azure OpenAI Studio
4. **API Version**: Use the latest available version (check Azure OpenAI documentation)

## Usage

### Starting the Server

Choose your preferred implementation:

#### Option A: Python (Flask)
```bash
python main.py
```

#### Option B: Node.js (Express)
```bash
node index.js
```

Both servers will start on `http://0.0.0.0:5005` by default.

### Making API Requests

Use the proxy just like the OpenAI API, but point to your local server:

```bash
curl -X POST http://localhost:5005/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_private_password_here" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {
        "role": "user",
        "content": "Hello, how are you?"
      }
    ]
  }'
```

### Streaming Requests

For streaming responses, add `"stream": true` to your request:

```bash
curl -X POST http://localhost:5005/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_private_password_here" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {
        "role": "user", 
        "content": "Tell me a story"
      }
    ],
    "stream": true
  }'
```

### Using with OpenAI Libraries

#### Python (openai library)

```python
import openai

client = openai.OpenAI(
    base_url="http://localhost:5005/v1",
    api_key="your_private_password_here"
)

response = client.chat.completions.create(
    model="gpt-4",  # This will be mapped to your Azure deployment
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)
```

#### JavaScript/Node.js

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'http://localhost:5005/v1',
  apiKey: 'your_private_password_here',
});

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
});

console.log(response.choices[0].message.content);
```

## API Endpoints

### POST /v1/chat/completions

Proxies chat completion requests to Azure OpenAI Service.

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <your_private_password>`

**Request Body:**
Same as OpenAI API chat completions format.

**Response:**
Returns the Azure OpenAI response in OpenAI API format.

## Security Considerations

1. **Change the default password**: Replace `your_private_password_here` with a strong, unique password
2. **HTTPS in production**: Use HTTPS in production environments
3. **Environment variables**: Consider moving sensitive configuration to environment variables
4. **Rate limiting**: Implement rate limiting for production use
5. **Network security**: Restrict access to trusted networks/IPs if needed

## Production Deployment

### Python (Flask) Production

1. **Use a production WSGI server** like Gunicorn or uWSGI:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5005 main:app
```

2. **Environment variables** for configuration:
```python
import os
AZURE_OPENAI_ENDPOINT = os.getenv('AZURE_OPENAI_ENDPOINT')
AZURE_OPENAI_API_KEY = os.getenv('AZURE_OPENAI_API_KEY')
# ... etc
```

### Node.js (Express) Production

1. **Use PM2 for process management**:
```bash
npm install -g pm2
pm2 start index.js --name "azure-openai-proxy"
pm2 startup
pm2 save
```

2. **Set production environment**:
```bash
export NODE_ENV=production
```

3. **Use environment variables** (already implemented in the Node.js version)

### General Production Considerations

1. **Reverse proxy** with nginx or similar for SSL termination and load balancing
2. **HTTPS**: Always use HTTPS in production environments
3. **Rate limiting**: Implement rate limiting for production use
4. **Monitoring**: Set up logging and monitoring for your chosen implementation

## Implementation Comparison

| Feature | Python (Flask) | Node.js (Express) |
|---------|----------------|-------------------|
| **Performance** | Good for I/O bound tasks | Excellent for concurrent connections |
| **Memory Usage** | Moderate | Lower |
| **Ecosystem** | Rich Python ecosystem | Rich npm ecosystem |
| **Configuration** | Direct code or env vars | Environment variables (recommended) |
| **Production Ready** | Use with Gunicorn/uWSGI | Use with PM2 or similar |
| **Deployment** | Traditional server deployment | Cloud-native friendly |

Choose based on your team's expertise and infrastructure preferences.

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check that your private password matches in both client and server
2. **503 Service Unavailable**: Verify your Azure OpenAI endpoint and API key are correct
3. **500 Internal Server Error**: Check the server logs for specific error details
4. **Module/Package not found**: 
   - **Python**: Run `pip install flask flask-cors requests`
   - **Node.js**: Run `npm install express cors axios`
5. **Port already in use**: Change the port in the code or stop the conflicting service

### Implementation-Specific Issues

#### Python (Flask)
- **Import errors**: Ensure you're using the correct Python environment
- **WSGI issues**: Use `gunicorn` for production instead of the built-in server

#### Node.js (Express)
- **Environment variables**: The Node.js version requires environment variables to be set
- **Process management**: Use PM2 or similar for production deployments

### Logging

Both implementations include error logging. Check the console output for detailed error messages.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Available in both Python (Flask) and Node.js (Express) implementations
- Built for Azure OpenAI Service compatibility
- Designed for seamless integration with OpenAI API clients
