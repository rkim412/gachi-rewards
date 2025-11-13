/**
 * Vercel Serverless Function Handler for React Router v7
 * This handles all requests and routes them through React Router
 * 
 * Note: Node.js 20+ (used by Vercel) has native fetch, Request, Response support,
 * so installGlobals is not needed. We skip it to avoid CommonJS import issues.
 */

// Import createStaticHandler from react-router
// In React Router v7, this should be available from the react-router package
import { createStaticHandler } from "react-router";

// Lazy load the build and create request handler
let requestHandler;
let staticHandler;
async function getRequestHandler() {
  if (requestHandler) {
    return requestHandler;
  }

  try {
    // Import the server build - React Router v7 exports build config
    const build = await import("../build/server/index.js");
    
    // Log build structure for debugging
    console.log("📦 Build structure:", {
      hasRoutes: !!build.routes,
      routesType: typeof build.routes,
      routesIsArray: Array.isArray(build.routes),
      routesLength: build.routes?.length || 0,
      hasEntry: !!build.entry,
      entryType: typeof build.entry,
      availableExports: Object.keys(build),
    });
    
    // Get routes from build, or fallback to empty array
    // React Router v7 should export routes in build.routes
    let routes = build.routes;
    
    // If routes is not available in build, try to get it from the routes export
    if (!routes || !Array.isArray(routes) || routes.length === 0) {
      console.log("⚠️  build.routes not available, attempting to import routes directly...");
      try {
        // Try importing routes from the built routes file
        const routesModule = await import("../build/server/routes.js");
        routes = routesModule.default || routesModule.routes || [];
        console.log("✅ Imported routes from build/server/routes.js:", routes.length);
      } catch (routesError) {
        console.warn("⚠️  Could not import routes from build/server/routes.js:", routesError.message);
        routes = []; // Fallback to empty array
      }
    }
    
    // Ensure routes is always an array
    if (!Array.isArray(routes)) {
      console.warn("⚠️  routes is not an array, converting to array");
      routes = [];
    }
    
    console.log("✅ Using routes:", {
      count: routes.length,
      isArray: Array.isArray(routes),
    });
    
    // Create a static handler using React Router's createStaticHandler
    // This will create the proper context structure that ServerRouter expects
    if (!createStaticHandler) {
      console.error("❌ createStaticHandler is not available from react-router");
      throw new Error("createStaticHandler is not available. Please check React Router v7 installation.");
    }
    
    try {
      staticHandler = createStaticHandler(routes);
      console.log("✅ Created static handler with routes:", routes.length);
    } catch (handlerError) {
      console.error("❌ Failed to create static handler:", handlerError);
      throw handlerError;
    }
    
    // React Router v7's build structure: entry.module is a Module object with default export
    // The error logs show: entry.module.default is [AsyncFunction: handleRequest]
    // So we can use build.entry.module.default directly!
    
    // Check if build.entry.module exists and has a default function
    if (build.entry?.module?.default && typeof build.entry.module.default === "function") {
      const handleRequest = build.entry.module.default;
      console.log("✅ Found handleRequest in build.entry.module.default");
      
      // Create a handler that matches React Router's expected signature
      requestHandler = async (request, context = {}) => {
        // Use createStaticHandler to get the proper context structure
        // This ensures ServerRouter receives the context in the format it expects
        let reactRouterContext;
        
        try {
          // Query the static handler to get the proper context
          // This creates a context with the correct structure for ServerRouter
          const queryContext = await staticHandler.query(request);
          
          // If query returns a Response (redirect, error, etc.), return it directly
          if (queryContext instanceof Response) {
            return queryContext;
          }
          
          // The context from staticHandler.query is the proper structure ServerRouter expects
          reactRouterContext = queryContext;
          
          console.log("✅ Created context from staticHandler.query:", {
            hasContext: !!reactRouterContext,
            hasRoutes: !!(reactRouterContext && reactRouterContext.routes),
            contextKeys: reactRouterContext ? Object.keys(reactRouterContext) : [],
          });
        } catch (queryError) {
          console.error("❌ Error querying static handler:", queryError);
          // Fallback to manual context creation if query fails
          reactRouterContext = {
            routes: routes,
            staticHandlerContext: {
              url: request.url,
              matches: [],
              loaderData: {},
              actionData: {},
              errors: null,
            },
            build: {
              assets: build.assets,
              entry: build.entry,
              routes: routes,
              publicPath: build.publicPath || "/",
              assetsBuildDirectory: build.assetsBuildDirectory || "build/client",
            },
          };
          console.warn("⚠️  Using fallback context structure");
        }
        
        // Ensure reactRouterContext is never undefined
        if (!reactRouterContext) {
          console.error("❌ reactRouterContext is undefined after query");
          return new Response("Internal Server Error: Invalid router context", { status: 500 });
        }
        
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
          console.error("Context structure:", {
            hasContext: !!reactRouterContext,
            hasRoutes: !!(reactRouterContext && reactRouterContext.routes),
            routesType: typeof reactRouterContext?.routes,
            routesIsArray: Array.isArray(reactRouterContext?.routes),
            contextType: typeof reactRouterContext,
            contextKeys: reactRouterContext ? Object.keys(reactRouterContext) : [],
          });
          return new Response("Internal Server Error", { status: 500 });
        }
      };
    }
    
    // If we still don't have a handler, try to use React Router's routing system
    // React Router v7 might need us to construct the handler from routes
    if (!requestHandler && build.routes) {
      console.log("Attempting to create handler from routes...");
      
      // Try to import React Router's server utilities
      try {
        // React Router v7 might export a createRequestHandler or similar
        // Let's try importing from react-router/server or similar
        const { createRequestHandler } = await import("react-router/server");
        requestHandler = createRequestHandler({
          build,
          mode: process.env.NODE_ENV || "production",
        });
        console.log("✅ Created handler using react-router/server");
      } catch (routerError) {
        console.error("Failed to use react-router/server:", routerError.message);
        
        // Last resort: try to manually construct a basic handler
        // This is a simplified version that might work for basic routes
        console.log("Attempting manual route handler construction...");
        
        // Import the entry server directly from the source location
        try {
          const entryServer = await import("../../app/entry.server.jsx");
          if (typeof entryServer.default === "function") {
            const handleRequest = entryServer.default;
            
            requestHandler = async (request, context = {}) => {
              // We need to create a proper React Router context
              // This is a simplified version
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
            console.log("✅ Created handler using app/entry.server.jsx");
          }
        } catch (sourceError) {
          console.error("Failed to import from app/entry.server.jsx:", sourceError.message);
        }
      }
    }
    
    // Final check
    if (!requestHandler) {
      console.error("Could not find server entry file. Build structure:", {
        hasRoutes: !!build.routes,
        entry: build.entry,
        availableExports: Object.keys(build),
      });
      
      throw new Error(
        "Could not find server handler. " +
        "Tried entry files: " + possibleEntryPaths.join(", ") + ". " +
        "Build has routes: " + !!build.routes + ". " +
        "Please check build/server directory structure."
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

