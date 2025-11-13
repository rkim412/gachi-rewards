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
    
    // React Router v7's build exports config with an 'entry' field
    // The entry might be a string path or an object with module/file properties
    let entryPath = null;
    
    if (build.entry) {
      // Handle different entry formats
      if (typeof build.entry === "string") {
        entryPath = build.entry;
      } else if (build.entry.module) {
        entryPath = build.entry.module;
      } else if (build.entry.file) {
        entryPath = build.entry.file;
      } else {
        // Log the entry structure for debugging
        console.log("build.entry structure:", JSON.stringify(build.entry, null, 2));
      }
    }
    
    // Try to import the server entry if we have a path
    if (entryPath && typeof entryPath === "string") {
      // Ensure the path is relative and doesn't start with ./
      const normalizedPath = entryPath.startsWith("./") 
        ? entryPath 
        : `./${entryPath}`;
      
      try {
        const serverEntry = await import(`../build/server/${normalizedPath}`);
        
        // The server entry should export a default handler function
        if (typeof serverEntry.default === "function") {
          requestHandler = serverEntry.default;
        } else if (serverEntry.handler) {
          requestHandler = serverEntry.handler;
        } else {
          throw new Error("Handler not found in server entry. Available exports: " + Object.keys(serverEntry).join(", "));
        }
      } catch (importError) {
        console.error("Failed to import server entry:", importError.message);
        // Fall through to try other methods
      }
    } else if (entryPath) {
      // entryPath exists but is not a string - log it for debugging
      console.log("entryPath is not a string, type:", typeof entryPath, "value:", JSON.stringify(entryPath));
    }
    
    // Fallback: try to use @react-router/serve's createRequestHandler
    if (!requestHandler) {
      try {
        const { createRequestHandler } = await import("@react-router/serve");
        requestHandler = createRequestHandler({
          build,
          mode: process.env.NODE_ENV || "production",
        });
      } catch (serveError) {
        console.error("Failed to use @react-router/serve:", serveError.message);
        // Continue to other fallbacks
      }
    }
    
    // Final fallbacks
    if (!requestHandler) {
      if (typeof build.default === "function") {
        requestHandler = build.default;
      } else if (build.handler) {
        requestHandler = build.handler;
      } else {
        throw new Error("React Router handler not found in build. Available exports: " + Object.keys(build).join(", ") + ". Entry: " + JSON.stringify(build.entry));
      }
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

