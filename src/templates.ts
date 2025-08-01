export const swaggerUITemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin:0;
      background: #fafafa;
    }
    .swagger-ui .topbar {
      background-color: #2d3748;
    }
    .swagger-ui .topbar .download-url-wrapper .select-label {
      color: white;
    }
    .swagger-ui .topbar .download-url-wrapper input[type=text] {
      border: none;
      outline: none;
    }
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #666;
    }
    .loading-spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-right: 15px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="loading" class="loading">
    <div class="loading-spinner"></div>
    <div>Loading API Documentation...</div>
  </div>
  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      // Get the current URL to construct the OpenAPI spec URL
      const currentUrl = window.location.href;
      const specUrl = currentUrl.endsWith('/') 
        ? currentUrl + 'openapi.json' 
        : currentUrl + '/openapi.json';

      // Initialize Swagger UI
      const ui = SwaggerUIBundle({
        url: specUrl,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        tryItOutEnabled: true,
        requestInterceptor: function(request) {
          // Add any request interceptors here if needed
          return request;
        },
        responseInterceptor: function(response) {
          // Add any response interceptors here if needed
          return response;
        },
        onComplete: function() {
          // Hide loading spinner and show swagger ui
          document.getElementById('loading').style.display = 'none';
          document.getElementById('swagger-ui').style.display = 'block';
        },
        onFailure: function(error) {
          console.error('Swagger UI failed to load:', error);
          document.getElementById('loading').innerHTML = 
            '<div style="color: red;">Failed to load API documentation. Please check the console for errors.</div>';
        }
      });

      // Set a timeout to show error if loading takes too long
      setTimeout(function() {
        const loadingEl = document.getElementById('loading');
        if (loadingEl && loadingEl.style.display !== 'none') {
          loadingEl.innerHTML = 
            '<div style="color: orange;">Loading is taking longer than expected. Please check your network connection.</div>';
        }
      }, 10000);
    };
  </script>
</body>
</html>
`;

export const errorTemplate = (error: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documentation Error</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 40px;
      background: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .error {
      color: #e53e3e;
      background: #fed7d7;
      border: 1px solid #feb2b2;
      border-radius: 4px;
      padding: 16px;
      margin: 20px 0;
    }
    h1 {
      color: #2d3748;
      margin-bottom: 20px;
    }
    .code {
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 12px;
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 14px;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Documentation Generation Error</h1>
    <div class="error">
      <strong>Error:</strong> ${error}
    </div>
    <p>There was an issue generating the API documentation. Please check your Hono application setup.</p>
  </div>
</body>
</html>
`;