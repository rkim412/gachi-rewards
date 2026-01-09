/**
 * API endpoint to trigger webhook queue processing
 * 
 * This endpoint can be called:
 * - By a cron job (Vercel Cron, external cron service)
 * - By a serverless function on a schedule
 * - Manually for testing
 * 
 * URL: /api/webhooks/process
 * Method: POST (or GET for manual triggers)
 */

import {
  getPendingWebhooks,
  getFailedWebhooksForRetry,
  markWebhookProcessing,
  markWebhookCompleted,
  markWebhookFailed,
} from "../services/webhook-queue.server.js";
import { processWebhook } from "../services/webhook-processor.server.js";

const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 10;

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(attempt) {
  const RETRY_DELAY_MS = 1000;
  const MAX_RETRY_DELAY_MS = 60000;
  const delay = Math.min(RETRY_DELAY_MS * Math.pow(2, attempt - 1), MAX_RETRY_DELAY_MS);
  const jitter = Math.random() * 0.3 * delay;
  return Math.floor(delay + jitter);
}

/**
 * Process a single webhook
 */
async function processWebhookRecord(webhook) {
  try {
    console.log(`[WORKER] Processing webhook ${webhook.id} (attempt ${webhook.attempts + 1}/${MAX_ATTEMPTS})`);
    await markWebhookProcessing(webhook.id);

    const queueRecord = {
      id: webhook.id,
      topic: webhook.topic,
      shop: webhook.shop,
      payload: webhook.payload,
    };

    await processWebhook(queueRecord);
    await markWebhookCompleted(webhook.id);
    console.log(`[WORKER] ✅ Successfully processed webhook ${webhook.id}`);
    return true;
  } catch (error) {
    console.error(`[WORKER] ❌ Error processing webhook ${webhook.id}:`, error);
    const { shouldRetry } = await markWebhookFailed(
      webhook.id,
      error.message || String(error),
      true,
      MAX_ATTEMPTS
    );
    if (shouldRetry) {
      console.log(`[WORKER] ⏳ Webhook ${webhook.id} will be retried`);
    } else {
      console.error(`[WORKER] 🛑 Webhook ${webhook.id} failed after ${MAX_ATTEMPTS} attempts`);
    }
    return false;
  }
}

/**
 * Process queue (single run)
 */
async function processQueue() {
  let processed = 0;
  let success = 0;
  let failed = 0;

  // Process pending webhooks
  const pendingWebhooks = await getPendingWebhooks(BATCH_SIZE);
  if (pendingWebhooks.length > 0) {
    console.log(`[WORKER] Found ${pendingWebhooks.length} pending webhook(s)`);
    for (const webhook of pendingWebhooks) {
      const result = await processWebhookRecord(webhook);
      processed++;
      if (result) success++;
      else failed++;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Process failed webhooks for retry
  const failedWebhooks = await getFailedWebhooksForRetry(BATCH_SIZE, MAX_ATTEMPTS);
  if (failedWebhooks.length > 0) {
    console.log(`[WORKER] Found ${failedWebhooks.length} failed webhook(s) to retry`);
    for (const webhook of failedWebhooks) {
      const result = await processWebhookRecord(webhook);
      processed++;
      if (result) success++;
      else failed++;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return { processed, success, failed };
}

export const loader = async ({ request }) => {
  // Allow GET for manual triggers (e.g., from browser or cron)
  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "true";
  
  try {
    console.log("[API] Webhook queue processing triggered");
    
    // Process queue (single run)
    const result = await processQueue();
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook queue processed",
        processed: result.processed,
        succeeded: result.success,
        failed: result.failed,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[API] Error processing webhook queue:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process webhook queue",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const action = loader;

export default function WebhookProcessAPI() {
  return null;
}
