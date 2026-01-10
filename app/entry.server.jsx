import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { ServerRouter } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { isbot } from "isbot";
import { addDocumentResponseHeaders } from "./shopify.server";

export const streamTimeout = 5000;

export default function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  routerContext,
) {
  addDocumentResponseHeaders(request, responseHeaders);
  const userAgent = request.headers.get("user-agent");
  const callbackName = isbot(userAgent ?? "") ? "onAllReady" : "onShellReady";

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/60c012cc-d459-4e97-97d9-14bc07e6255d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'entry.server.jsx:16',message:'routerContext received in entry.server',data:{hasContext:!!routerContext,hasBuild:!!routerContext?.build,buildKeys:routerContext?.build?Object.keys(routerContext.build):[],hasEntry:!!routerContext?.build?.entry,hasEntryModule:!!routerContext?.build?.entry?.module,entryKeys:routerContext?.build?.entry?Object.keys(routerContext.build.entry):[],entryModuleKeys:routerContext?.build?.entry?.module?Object.keys(routerContext.build.entry.module):[],hasRoutes:!!routerContext?.build?.routes,entryModuleDefault:typeof routerContext?.build?.entry?.module?.default},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter
        context={routerContext}
        url={request.url}
      />,
      {
        [callbackName]: () => {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          console.error(error);
        },
      },
    );

    // Automatically timeout the React renderer after 6 seconds, which ensures
    // React has enough time to flush down the rejected boundary contents
    setTimeout(abort, streamTimeout + 1000);
  });
}
