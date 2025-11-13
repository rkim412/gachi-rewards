/**
 * Vercel Serverless Function Handler for React Router v7
 * This handles all requests and routes them through React Router
 */

import { installGlobals } from "@react-router/node";
import { createRequestHandler } from "@react-router/serve";

// Install Node.js globals (fetch, Request, Response, etc.)
installGlobals();

// Lazy load the build and create request handler
let requestHandler;
async function getRequestHandler() {
  if (requestHandler) {
    return requestHandler;
  }

  try {
    const build = await import("../build/server/index.js");
    requestHandler = createRequestHandler({
      build,
      mode: process.env.NODE_ENV || "production",
    });
    return requestHandler;
  } catch (error) {
    console.error("Failed to import React Router build:", error);
    throw error;
  }
}

export default async function handler(req, res) {
  try {
    // Create a proper URL from the request
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host;
    const url = new URL(req.url, `${protocol}://${host}`);

    // Create a Request object compatible with React Router
    const request = new Request(url, {
      method: req.method,
      headers: new Headers(req.headers),
      body:
        req.method !== "GET" && req.method !== "HEAD" && req.body
          ? JSON.stringify(req.body)
          : undefined,
    });

    // Get or create the request handler
    const handler = await getRequestHandler();
    
    // Call the React Router request handler
    const response = await handler(request);

    // Convert Response headers to Vercel format
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Set status and headers
    res.status(response.status);
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Handle response body
    if (response.body) {
      // For streaming responses, we need to handle them differently
      if (response.body instanceof ReadableStream) {
        const reader = response.body.getReader();
        const chunks = [];

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }

          const buffer = Buffer.concat(chunks);
          res.send(buffer);
        } catch (streamError) {
          console.error("Error reading response stream:", streamError);
          res.status(500).json({ error: "Failed to read response" });
        }
      } else {
        // For non-streaming responses, convert to text
        const text = await response.text();
        res.send(text);
      }
    } else {
      res.end();
    }
  } catch (error) {
    console.error("Error in Vercel handler:", error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

