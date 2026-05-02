/**
 * Cloudflare Worker — Anthropic API CORS Proxy
 * For: AQA GCSE Biology revision site on GitHub Pages
 *
 * Deploy this at: workers.cloudflare.com
 * Once deployed, update PROXY_URL in quiz.html to your worker URL.
 *
 * This worker:
 *  - Accepts POST requests from your GitHub Pages site
 *  - Forwards them to api.anthropic.com/v1/messages
 *  - Adds the required CORS headers so the browser doesn't block it
 *  - Passes through the x-api-key header from the client
 */

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

// Restrict to your GitHub Pages domain for security.
// Replace with your actual GitHub Pages URL, e.g. https://yourusername.github.io
// Set to '*' during testing, but lock it down before sharing the site.
const ALLOWED_ORIGIN = '*'; // e.g. 'https://yourusername.github.io'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
};

export default {
  async fetch(request) {

    // Handle preflight OPTIONS request (browser sends this before POST)
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
    }

    try {
      // Get the API key and body from the incoming request
      const apiKey = request.headers.get('x-api-key');
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'Missing x-api-key header' }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      const body = await request.text();

      // Forward to Anthropic
      const anthropicResponse = await fetch(ANTHROPIC_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body,
      });

      // Return Anthropic's response with CORS headers added
      const responseBody = await anthropicResponse.text();
      return new Response(responseBody, {
        status: anthropicResponse.status,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
        },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }
};
