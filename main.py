import os
import requests
from flask import Flask, request, jsonify, stream_with_context
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for all routes and origins.
# This will automatically handle OPTIONS pre-flight requests.
CORS(app)

# Get Azure OpenAI Service configuration from environment variables
AZURE_OPENAI_ENDPOINT = "your_azure_openai_endpoint_here"  # Replace with your actual endpoint
AZURE_OPENAI_API_KEY = "your_azure_openai_api_key_here"  # Replace with your actual API key
AZURE_OPENAI_DEPLOYMENT = "gpt-4.1-nano" # Replace with your actual deployment name
AZURE_OPENAI_API_VERSION = "2024-05-01-preview" # Replace with your actual API version

# Define a private password for authorization
private_password = "your_private_password_here" # Replace with your actual password

# Check for required environment variables
if not all([AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT]):
    raise ValueError("Missing one or more required environment variables: AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT")

@app.route('/v1/chat/completions', methods=['POST', 'OPTIONS'])
def chat_completions():
    """
    Reverse proxy endpoint for OpenAI Chat Completions.
    Flask-CORS automatically handles the OPTIONS method,
    so we just need to ensure it's listed in the methods.
    """
    if request.method == 'OPTIONS':
        # The CORS extension handles the response, so we can return an empty response.
        return "", 200
    
    if request.headers.get('Authorization') != f"Bearer {private_password}":
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        # Get the JSON body from the incoming request
        request_data = request.get_json()

        # Construct the full URL for the Azure OpenAI API
        azure_url = (
            f"{AZURE_OPENAI_ENDPOINT}/openai/deployments/{AZURE_OPENAI_DEPLOYMENT}"
            f"/chat/completions?api-version={AZURE_OPENAI_API_VERSION}"
        )

        # Set up the headers for the Azure API request
        headers = {
            'Content-Type': 'application/json',
            'api-key': AZURE_OPENAI_API_KEY
        }
        
        # The 'model' parameter in the OpenAI request body should be mapped to the deployment
        # Azure's API uses the deployment name from the URL, but we'll ensure the body is clean.
        request_data['model'] = AZURE_OPENAI_DEPLOYMENT

        # Check if the request is for streaming
        is_stream = request_data.get("stream", False)

        # Forward the request to Azure OpenAI Service
        response = requests.post(
            azure_url,
            headers=headers,
            json=request_data,
            stream=is_stream
        )
        
        # Handle streaming response
        if is_stream:
            # The 'Transfer-Encoding: chunked' header is automatically handled by requests when streaming.
            # We use stream_with_context to efficiently stream the response back to the client.
            def generate_stream():
                for chunk in response.iter_content(chunk_size=None):
                    yield chunk
            
            # Get headers from Azure's response and forward them, excluding certain ones
            excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
            headers = [(name, value) for (name, value) in response.raw.headers.items() if name.lower() not in excluded_headers]
            
            return app.response_class(stream_with_context(generate_stream()), headers=headers)

        # Handle non-streaming response
        else:
            response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
            return jsonify(response.json())

    except requests.exceptions.RequestException as e:
        # Handle network-related errors
        return jsonify({"error": f"Failed to connect to Azure OpenAI Service: {str(e)}"}), 503
    except Exception as e:
        # Handle other potential errors
        app.logger.error(f"An unexpected error occurred: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

if __name__ == '__main__':
    # Run the Flask app
    # For production, use a proper WSGI server like Gunicorn or uWSGI
    app.run(host='0.0.0.0', port=5005)