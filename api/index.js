/**
 * Vercel Serverless Function Handler for React Router v7
 * This handles all requests and routes them through React Router
 * 
 * Note: Node.js 20+ (used by Vercel) has native fetch, Request, Response support,
 * so installGlobals is not needed. We skip it to avoid CommonJS import issues.
 */

// Lazy load the build and create request handler
let requestHandler;
async function getRequestHandler() {
  if (requestHandler) {
    return requestHandler;
  }

  try {
    // Import the server build - React Router v7 exports build config, not a handler directly
    const build = await import("../build/server/index.js");
    
    // React Router v7's build structure: entry.module contains config, not file path
    // The actual server handler needs to be constructed from the build
    // Try to import the entry server file directly
    let serverEntry = null;
    
    // Try common server entry file paths
    const possibleEntryPaths = [
      "entry.server.js",
      "entry.server.mjs",
      "entry.server.jsx",
      "index.js",
      "index.mjs",
    ];
    
    for (const path of possibleEntryPaths) {
      try {
        const attempt = await import(`../build/server/${path}`);
        if (typeof attempt.default === "function") {
          serverEntry = attempt;
          console.log(`✅ Found server entry at: ${path}`);
          break;
        }
      } catch (e) {
        // Continue to next path
      }
    }
    
    // If we found the server entry, use it
    if (serverEntry) {
      if (typeof serverEntry.default === "function") {
        // The entry.server.jsx exports a handleRequest function
        // We need to wrap it to create a full request handler
        const handleRequest = serverEntry.default;
        
        // Create a handler that matches React Router's expected signature
        requestHandler = async (request, context = {}) => {
          // React Router v7 expects a context with reactRouterContext
          // We need to create a minimal context
          const reactRouterContext = {
            staticHandlerContext: {
              url: request.url,
              matches: [],
            },
          };
          
          let responseStatusCode = 200;
          const responseHeaders = new Headers();
          
          try {
            const response = await handleRequest(
              request,
              responseStatusCode,
              responseHeaders,
              reactRouterContext
            );
            return response;
          } catch (error) {
            console.error("Error in handleRequest:", error);
            return new Response("Internal Server Error", { status: 500 });
          }
        };
      }
    }
    
    // If we still don't have a handler, try to use the routes directly
    if (!requestHandler && build.routes) {
      console.log("Attempting to create handler from routes...");
      // This is a fallback - React Router v7 should have a better way
      // For now, we'll throw a more helpful error
      throw new Error(
        "Could not find server handler. Build structure: " +
        JSON.stringify({
          hasRoutes: !!build.routes,
          entry: build.entry,
          availableExports: Object.keys(build),
        }, null, 2)
      );
    }
    
    // Final check
    if (!requestHandler) {
      throw new Error(
        "React Router handler not found. Available exports: " +
        Object.keys(build).join(", ") +
        ". Entry: " +
        JSON.stringify(build.entry)
      );
    }
    
    return requestHandler;
  } catch (error) {
    console.error("Failed to import React Router build:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    throw error;
  }
}

export default async function handler(req, res) {
  try {
    // Create a proper URL from the request
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host;
    const url = new URL(req.url || "/", `${protocol}://${host}`);

    // Create a Request object compatible with React Router
    const request = new Request(url, {
      method: req.method || "GET",
      headers: new Headers(req.headers),
      body:
        req.method !== "GET" && req.method !== "HEAD" && req.body
          ? (typeof req.body === "string" ? req.body : JSON.stringify(req.body))
          : undefined,
    });

    // Get or create the request handler
    const handler = await getRequestHandler();
    
    // Call the React Router request handler
    // React Router v7 handlers expect (request, context) where context has waitUntil
    const response = await handler(request, {
      waitUntil: (promise) => {
        // In serverless, we can't wait for background tasks, but we need to handle the promise
        promise.catch((err) => console.error("Background task failed:", err));
      },
    });

    // Convert Response headers to Vercel format
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Set status and headers
    res.status(response.status || 200);
    Object.entries(headers).forEach(([key, value]) => {
      // Skip setting certain headers that Vercel manages
      if (key.toLowerCase() !== "content-encoding") {
        res.setHeader(key, value);
      }
    });

    // Handle response body
    if (response.body) {
      // For streaming responses
      if (response.body instanceof ReadableStream) {
        const reader = response.body.getReader();
        const chunks = [];

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(Buffer.from(value));
          }

          const buffer = Buffer.concat(chunks);
          res.send(buffer);
        } catch (streamError) {
          console.error("Error reading response stream:", streamError);
          res.status(500).json({ error: "Failed to read response stream" });
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
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // Send error response
    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
        // Only include stack in development
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
      });
    }
  }
}

