import prisma from "../app/db.server.js";
import { processWebhook } from "../app/services/webhook-processor.server.js";
import {
  getPendingWebhooks,
  markWebhookProcessing,
  markWebhookCompleted,
  markWebhookFailed,
  getFailedWebhooksForRetry,
} from "../app/services/webhook-queue.server.js";
import { fileURLToPath } from 'url';

/**
 * Background Worker for Processing Webhook Queue
 * 
 * This script processes queued webhooks asynchronously.
 * Run this as a background job (cron, worker process, or serverless function).
 * 
 * Usage:
 *   - Run manually: node scripts/process-webhook-queue.js
 *   - Run as cron: every minute (use cron syntax: *\/1 * * * *)
 *   - Run as worker: node scripts/process-webhook-queue.js --watch
 */

const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 10;
const RETRY_DELAY_MS = 1000; // Base delay: 1 second
const MAX_RETRY_DELAY_MS = 60000; // Max delay: 60 seconds

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number (1-based)
 * @returns {number} Delay in milliseconds
 */
function calculateBackoffDelay(attempt) {
  const delay = Math.min(RETRY_DELAY_MS * Math.pow(2, attempt - 1), MAX_RETRY_DELAY_MS);
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay; // Up to 30% jitter
  return Math.floor(delay + jitter);
}

/**
 * Process a single webhook
 * @param {object} webhook - Webhook queue record
 * @returns {Promise<boolean>} - True if successful, false if failed
 */
async function processWebhookRecord(webhook) {
  try {
    // Mark as processing
    await markWebhookProcessing(webhook.id);

    // Parse payload
    const payload = JSON.parse(webhook.payload);

    // Create queue record format for processor
    const queueRecord = {
      id: webhook.id,
      topic: webhook.topic,
      siteId: webhook.siteId, // Use siteId field (shop domain string)
      payload: webhook.payload,
    };

    // Process webhook (admin context will be retrieved from shop domain if needed)
    await processWebhook(queueRecord);

    // Mark as completed
    await markWebhookCompleted(webhook.id);

    return true;
  } catch (error) {
    console.error(`[WORKER] Error processing webhook ${webhook.id}:`, error.message);

    // Mark as failed (with retry logic)
    const { shouldRetry, attempts } = await markWebhookFailed(
      webhook.id,
      error.message || String(error),
      true, // retry
      MAX_ATTEMPTS
    );

    if (!shouldRetry) {
      console.error(`[WORKER] Webhook ${webhook.id} failed after ${MAX_ATTEMPTS} attempts`);
    }

    return false;
  }
}

/**
 * Process a batch of webhooks
 * @param {Array} webhooks - Array of webhook records
 * @returns {Promise<{success: number, failed: number}>}
 */
async function processBatch(webhooks) {
  let success = 0;
  let failed = 0;

  // Process webhooks sequentially to avoid overwhelming the database
  for (const webhook of webhooks) {
    const result = await processWebhookRecord(webhook);
    if (result) {
      success++;
    } else {
      failed++;
    }

    // Small delay between webhooks to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return { success, failed };
}

/**
 * Main processing function
 * @param {boolean} watch - If true, run continuously
 */
async function processQueue(watch = false) {
  do {
    try {
      // Process pending webhooks
      const pendingWebhooks = await getPendingWebhooks(BATCH_SIZE);
      
      if (pendingWebhooks.length > 0) {
        await processBatch(pendingWebhooks);
      } else {
        // Check for failed webhooks that should be retried
        const failedWebhooks = await getFailedWebhooksForRetry(BATCH_SIZE, MAX_ATTEMPTS);
        
        if (failedWebhooks.length > 0) {
          await processBatch(failedWebhooks);
        } else {
          if (watch) {
            // Wait before checking again
            await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds
          }
        }
      }
    } catch (error) {
      console.error(`[WORKER] Fatal error:`, error.message);
      
      if (watch) {
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 seconds
      } else {
        throw error;
      }
    }
  } while (watch);
}

// Run if called directly - improved detection for Windows
const __filename = fileURLToPath(import.meta.url);
const scriptPath = __filename;
const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('process-webhook-queue.js') ||
  scriptPath.endsWith('process-webhook-queue.js') ||
  process.argv[1].replace(/\\/g, '/').endsWith('scripts/process-webhook-queue.js') ||
  scriptPath.replace(/\\/g, '/').endsWith('scripts/process-webhook-queue.js')
);

if (isMainModule) {
  const watch = process.argv.includes("--watch");
  
  processQueue(watch)
    .then(() => {
      if (!watch) {
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error("[WORKER] Fatal error:", error.message);
      process.exit(1);
    });
}

export { processQueue, processWebhookRecord };
