/**
 * Vercel Serverless Function Handler for React Router v7
 * This handles all requests and routes them through React Router
 * 
 * Note: Node.js 20+ (used by Vercel) has native fetch, Request, Response support,
 * so installGlobals is not needed. We skip it to avoid CommonJS import issues.
 */

// Import createStaticHandler and createStaticRouter from react-router
// In React Router v7, these should be available from the react-router package
import { createStaticHandler, createStaticRouter } from "react-router";

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
      routesValue: build.routes, // Log actual value to see what it is
      hasRouteDiscovery: !!build.routeDiscovery,
      routeDiscoveryType: typeof build.routeDiscovery,
      hasEntry: !!build.entry,
      entryType: typeof build.entry,
      availableExports: Object.keys(build),
    });
    
    // Get routes from build
    // React Router v7 exports routes, but it might be in different formats
    let routes = build.routes;
    
    // Check if routes is a function (might need to be called)
    if (typeof routes === "function") {
      console.log("⚠️  build.routes is a function, attempting to call it...");
      try {
        routes = routes();
        console.log("✅ Called build.routes() function, got:", typeof routes, Array.isArray(routes) ? routes.length : "not array");
      } catch (funcError) {
        console.warn("⚠️  Error calling build.routes() function:", funcError.message);
        routes = null;
      }
    }
    
    // Check if routes is an object (route manifest) - convert to array
    if (routes && typeof routes === "object" && !Array.isArray(routes)) {
      console.log("⚠️  build.routes is a route manifest object, converting to array...");
      
      // React Router v7 exports routes as an object/map
      // We need to convert it to an array for createStaticHandler
      // The object has route IDs as keys and route definitions as values
      const routesArray = Object.values(routes);
      
      // Process routes to ensure they have components/elements
      // Routes with `module` properties need to be converted to use lazy() or have Component
      // React Router v7 route modules export a default component that needs to be loaded
      const processedRoutes = routesArray.map(route => {
        // If route already has Component, element, or lazy, use it as-is
        if (route.Component || route.element || route.lazy || route.component) {
          return route;
        }
        
        // If route has a module property, convert it to lazy loading
        // Route modules export a default component per React Router v7 docs
        if (route.module) {
          // Create a lazy loader for the module
          // The module should export a default component (per Route Module docs)
          const originalModulePath = route.module;
          
          // Build module paths to try - React Router v7 build structure
          // Module paths are typically relative to build/server/
          const pathsToTry = [];
          
          // If it's already an absolute path or URL, use it directly
          if (originalModulePath.startsWith('/') || originalModulePath.startsWith('http')) {
            pathsToTry.push(originalModulePath);
          } else {
            // Try different relative path resolutions
            // 1. Relative to build/server (most common)
            if (originalModulePath.startsWith('./')) {
              pathsToTry.push(`../build/server/${originalModulePath.slice(2)}`);
            } else if (originalModulePath.startsWith('../')) {
              pathsToTry.push(`../build/server/${originalModulePath}`);
            } else {
              // No leading ./ or ../, assume it's relative to build/server
              pathsToTry.push(`../build/server/${originalModulePath}`);
            }
            
            // 2. Try with .js extension if not present
            if (!originalModulePath.endsWith('.js') && !originalModulePath.endsWith('.jsx') && !originalModulePath.endsWith('.ts') && !originalModulePath.endsWith('.tsx')) {
              const withJs = pathsToTry[pathsToTry.length - 1] + '.js';
              pathsToTry.push(withJs);
            }
            
            // 3. Try original path as-is (might work in some cases)
            pathsToTry.push(originalModulePath);
          }
          
          return {
            ...route,
            lazy: async () => {
              let module;
              let lastError;
              
              // Try each path until one works
              for (const path of pathsToTry) {
                try {
                  module = await import(path);
                  console.log(`✅ Successfully loaded module ${originalModulePath} from ${path}`);
                  break;
                } catch (importError) {
                  lastError = importError;
                  // Continue to next path
                  continue;
                }
              }
              
              if (!module) {
                console.error(`❌ Failed to load module ${originalModulePath} from all paths:`, pathsToTry);
                console.error(`   Last error:`, lastError?.message);
                // Return a fallback component that renders nothing
                // This prevents the "no element" warning but won't render anything
                return {
                  Component: () => {
                    console.warn(`Route ${route.id || route.path} component failed to load`);
                    return null;
                  },
                };
              }
              
              // Route modules export a default component per React Router v7 docs
              // Return an object with Component from the module's default export
              const Component = module.default;
              
              if (!Component) {
                console.error(`❌ Module ${originalModulePath} does not have a default export`);
                return {
                  Component: () => {
                    console.warn(`Route ${route.id || route.path} has no default export`);
                    return null;
                  },
                };
              }
              
              return {
                Component: Component,
              };
            },
          };
        }
        
        // If route has no component and no module, log a warning but keep it
        // (might be a layout route with only children)
        if (!route.children && route.path !== undefined && route.path !== "") {
          console.warn(`⚠️  Route ${route.id || route.path} has no component or module`);
        }
        
        return route;
      });
      
      console.log("✅ Converted route manifest to array:", {
        totalRoutes: routesArray.length,
        processedRoutes: processedRoutes.length,
        routeIds: processedRoutes.map(r => r.id || r.path || "unknown").slice(0, 10),
        hasRootRoute: processedRoutes.some(r => r.path === "" || r.path === "/" || r.id === "root" || r.id?.includes("root") || r.id?.includes("_index")),
        rootRoute: processedRoutes.find(r => r.path === "" || r.path === "/" || r.id === "root" || r.id?.includes("root") || r.id?.includes("_index")),
        sampleRoute: processedRoutes[0] ? {
          id: processedRoutes[0].id,
          path: processedRoutes[0].path,
          hasModule: !!processedRoutes[0].module,
          hasComponent: !!(processedRoutes[0].Component || processedRoutes[0].element || processedRoutes[0].component),
          hasLazy: !!processedRoutes[0].lazy,
        } : null,
      });
      
      routes = processedRoutes;
    }
    
    // If routes is still not an array, try routeDiscovery
    if (!routes || !Array.isArray(routes) || routes.length === 0) {
      console.log("⚠️  build.routes not available as array, checking routeDiscovery...");
      if (build.routeDiscovery) {
        // routeDiscovery might contain route information
        if (typeof build.routeDiscovery === "function") {
          try {
            routes = build.routeDiscovery();
            console.log("✅ Called routeDiscovery() function, got:", typeof routes, Array.isArray(routes) ? routes.length : "not array");
          } catch (discoveryError) {
            console.warn("⚠️  Error calling routeDiscovery():", discoveryError.message);
          }
        } else if (Array.isArray(build.routeDiscovery)) {
          routes = build.routeDiscovery;
          console.log("✅ Using routeDiscovery as routes array:", routes.length);
        } else if (build.routeDiscovery.routes) {
          routes = build.routeDiscovery.routes;
          console.log("✅ Extracted routes from routeDiscovery.routes:", Array.isArray(routes) ? routes.length : "not array");
        }
      }
    }
    
    // If routes is still not available, try importing from source
    if (!routes || !Array.isArray(routes) || routes.length === 0) {
      console.log("⚠️  build.routes not available as array, attempting to import from source...");
      try {
        // Try importing routes from the source app/routes.js file
        const routesModule = await import("../../app/routes.js");
        routes = routesModule.default || routesModule.routes || [];
        // If it's a function, call it
        if (typeof routes === "function") {
          routes = routes();
        }
        console.log("✅ Imported routes from app/routes.js:", Array.isArray(routes) ? routes.length : "not array");
      } catch (routesError) {
        console.warn("⚠️  Could not import routes from app/routes.js:", routesError.message);
      }
    }
    
    // Ensure routes is always an array
    if (!Array.isArray(routes)) {
      console.warn("⚠️  routes is not an array, converting to array");
      routes = [];
    }
    
    // CRITICAL: Don't create static handler with empty routes
    if (!routes || routes.length === 0) {
      console.error("❌ Routes array is empty! Cannot create static handler.");
      console.error("Build structure:", {
        availableExports: Object.keys(build),
        hasRoutes: !!build.routes,
        buildKeys: Object.keys(build),
      });
      throw new Error(
        "Routes array is empty. " +
        "Available build exports: " + Object.keys(build).join(", ") + ". " +
        "Please check that routes are properly exported from app/routes.js"
      );
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
      console.log("✅ Static handler dataRoutes:", {
        hasDataRoutes: !!staticHandler.dataRoutes,
        dataRoutesType: typeof staticHandler.dataRoutes,
        dataRoutesIsArray: Array.isArray(staticHandler.dataRoutes),
        dataRoutesLength: staticHandler.dataRoutes?.length || 0,
      });
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
      
      // React Router v7's handleRequest might create the context internally
      // Let's try calling it directly with the build object to see if it handles context creation
      // If that doesn't work, we'll fall back to manually creating the context
      requestHandler = async (request, context = {}) => {
        let responseStatusCode = 200;
        const responseHeaders = new Headers();
        
        // Try using createStaticHandler to create the proper context
        let reactRouterContext;
        
        try {
          // Query the static handler to get routing state
          const queryContext = await staticHandler.query(request);
          
          // If query returns a Response (redirect, error, etc.), return it directly
          if (queryContext instanceof Response) {
            return queryContext;
          }
          
          // Create context with routes - Following React Router v7 docs pattern
          // Use handler.dataRoutes and createStaticRouter as shown in docs
          const dataRoutes = staticHandler.dataRoutes || routes;
          
          // Create static router using createStaticRouter as per React Router v7 docs
          // createStaticRouter(handler.dataRoutes, context)
          const router = createStaticRouter(dataRoutes, queryContext);
          
          reactRouterContext = {
            ...queryContext, // Routing state from query
            router: router,  // Add the router for StaticRouterProvider
            routes: dataRoutes,  // Use dataRoutes (processed routes) instead of raw routes
            dataRoutes: dataRoutes,  // Also add as dataRoutes property explicitly
            build: {
              assets: build.assets,
              entry: build.entry,
              routes: dataRoutes,  // Use dataRoutes in build object
              dataRoutes: dataRoutes,  // Add dataRoutes to build
              publicPath: build.publicPath || "/",
              assetsBuildDirectory: build.assetsBuildDirectory || "build/client",
            },
          };
          
          console.log("✅ Created context with dataRoutes:", {
            hasContext: !!reactRouterContext,
            hasRoutes: !!(reactRouterContext && reactRouterContext.routes),
            hasDataRoutes: !!(reactRouterContext && reactRouterContext.dataRoutes),
            hasBuildRoutes: !!(reactRouterContext && reactRouterContext.build && reactRouterContext.build.routes),
            hasBuildDataRoutes: !!(reactRouterContext && reactRouterContext.build && reactRouterContext.build.dataRoutes),
            hasStaticHandlerRoutes: !!(reactRouterContext && reactRouterContext.staticHandlerContext && reactRouterContext.staticHandlerContext.routes),
            contextKeys: reactRouterContext ? Object.keys(reactRouterContext) : [],
          });
        } catch (queryError) {
          console.error("❌ Error querying static handler:", queryError);
          // Fallback context - use dataRoutes if available
          const dataRoutes = staticHandler?.dataRoutes || routes;
          reactRouterContext = {
            routes: dataRoutes,
            dataRoutes: dataRoutes,
            build: {
              assets: build.assets,
              entry: build.entry,
              routes: dataRoutes,
              dataRoutes: dataRoutes,
              publicPath: build.publicPath || "/",
              assetsBuildDirectory: build.assetsBuildDirectory || "build/client",
            },
            staticHandlerContext: {
              url: request.url,
              matches: [],
              loaderData: {},
              actionData: {},
              errors: null,
              routes: dataRoutes,
              dataRoutes: dataRoutes,
            },
          };
          console.warn("⚠️  Using fallback context structure");
        }
        
        // Ensure reactRouterContext is never undefined
        if (!reactRouterContext) {
          console.error("❌ reactRouterContext is undefined after query");
          return new Response("Internal Server Error: Invalid router context", { status: 500 });
        }
        
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
            hasBuild: !!(reactRouterContext && reactRouterContext.build),
            hasBuildRoutes: !!(reactRouterContext && reactRouterContext.build && reactRouterContext.build.routes),
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

