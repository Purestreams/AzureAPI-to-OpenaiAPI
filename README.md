# Azure OpenAI to OpenAI API Proxy

A Flask-based reverse proxy that translates OpenAI API requests to Azure OpenAI Service, allowing you to use Azure OpenAI models with any OpenAI-compatible client.

## Features

- **OpenAI API Compatibility**: Accepts standard OpenAI API requests and forwards them to Azure OpenAI Service
- **Streaming Support**: Full support for streaming chat completions
- **CORS Enabled**: Cross-origin requests supported for web applications
- **Authorization**: Built-in API key authentication for security
- **Error Handling**: Comprehensive error handling with proper HTTP status codes

## Prerequisites

- Python 3.7 or higher
- Azure OpenAI Service subscription
- Azure OpenAI deployment (e.g., GPT-4, GPT-3.5-turbo)

## Installation

1. Clone this repository:
```bash
git clone https://github.com/Purestreams/AzureAPI-to-OpenaiAPI.git
cd AzureAPI-to-Openai
```

2. Install required dependencies:
```bash
pip install flask flask-cors requests
```

## Configuration

Before running the application, you need to configure your Azure OpenAI Service details in `main.py`:

```python
# Replace these placeholders with your actual values
AZURE_OPENAI_ENDPOINT = "https://your-resource-name.openai.azure.com"
AZURE_OPENAI_API_KEY = "your_azure_openai_api_key_here"
AZURE_OPENAI_DEPLOYMENT = "your-deployment-name"  # e.g., "gpt-4"
AZURE_OPENAI_API_VERSION = "2024-05-01-preview"
private_password = "your_private_password_here"
```

### Getting Azure OpenAI Configuration

1. **Endpoint**: Found in the Azure portal under your OpenAI resource → "Keys and Endpoint"
2. **API Key**: Also found in "Keys and Endpoint" section
3. **Deployment Name**: The name you gave to your model deployment in Azure OpenAI Studio
4. **API Version**: Use the latest available version (check Azure OpenAI documentation)

## Usage

### Starting the Server

Run the Flask application:

```bash
python main.py
```

The server will start on `http://0.0.0.0:5005` by default.

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

For production use, consider:

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

3. **Reverse proxy** with nginx or similar for SSL termination and load balancing

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check that your private password matches in both client and server
2. **503 Service Unavailable**: Verify your Azure OpenAI endpoint and API key are correct
3. **500 Internal Server Error**: Check the server logs for specific error details

### Logging

The application includes error logging. Check the console output for detailed error messages.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Flask and the Azure OpenAI Service
- Designed for compatibility with OpenAI API clients
