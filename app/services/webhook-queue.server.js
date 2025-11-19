import prisma from "../db.server.js";

/**
 * Webhook Queue Service
 * Implements Shopify's best practice of queuing webhooks for async processing
 * Ensures fast response to Shopify (< 5 seconds) while processing can take longer
 * 
 * Reference: https://shopify.dev/docs/apps/build/webhooks/subscribe/https#step-3-queue-your-webhooks-to-process-later-in-case-of-bursts-of-traffic
 */

/**
 * Queue a webhook for async processing
 * @param {string} topic - Webhook topic (e.g., "orders/create")
 * @param {string} shop - Shop domain (e.g., "store.myshopify.com")
 * @param {object} payload - Webhook payload object
 * @returns {Promise<{id: number}>} - Queue record ID
 */
export async function queueWebhook(topic, shop, payload) {
  try {
    const queueRecord = await prisma.webhookQueue.create({
      data: {
        topic,
        shop,
        payload: JSON.stringify(payload),
        status: "pending",
        attempts: 0,
      },
    });

    console.log(`[WEBHOOK QUEUE] Queued webhook ${queueRecord.id} for ${topic} from ${shop}`);
    return { id: queueRecord.id };
  } catch (error) {
    console.error(`[WEBHOOK QUEUE] Error queueing webhook:`, error);
    throw error;
  }
}

/**
 * Get next pending webhook to process
 * @param {number} limit - Maximum number of webhooks to fetch (default: 10)
 * @returns {Promise<Array>} - Array of pending webhook records
 */
export async function getPendingWebhooks(limit = 10) {
  try {
    const webhooks = await prisma.webhookQueue.findMany({
      where: {
        status: "pending",
      },
      orderBy: {
        createdAt: "asc",
      },
      take: limit,
    });

    return webhooks;
  } catch (error) {
    console.error(`[WEBHOOK QUEUE] Error fetching pending webhooks:`, error);
    throw error;
  }
}

/**
 * Mark webhook as processing
 * @param {number} id - Webhook queue record ID
 * @returns {Promise<void>}
 */
export async function markWebhookProcessing(id) {
  try {
    await prisma.webhookQueue.update({
      where: { id },
      data: {
        status: "processing",
        attempts: {
          increment: 1,
        },
      },
    });
  } catch (error) {
    console.error(`[WEBHOOK QUEUE] Error marking webhook as processing:`, error);
    throw error;
  }
}

/**
 * Mark webhook as completed
 * @param {number} id - Webhook queue record ID
 * @returns {Promise<void>}
 */
export async function markWebhookCompleted(id) {
  try {
    await prisma.webhookQueue.update({
      where: { id },
      data: {
        status: "completed",
        processedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`[WEBHOOK QUEUE] Error marking webhook as completed:`, error);
    throw error;
  }
}

/**
 * Mark webhook as failed
 * @param {number} id - Webhook queue record ID
 * @param {string} errorMessage - Error message
 * @returns {Promise<void>}
 */
export async function markWebhookFailed(id, errorMessage) {
  try {
    await prisma.webhookQueue.update({
      where: { id },
      data: {
        status: "failed",
        error: errorMessage,
        processedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`[WEBHOOK QUEUE] Error marking webhook as failed:`, error);
    throw error;
  }
}

/**
 * Clean up old completed webhooks (older than specified days)
 * @param {number} daysOld - Delete webhooks older than this many days (default: 7)
 * @returns {Promise<number>} - Number of webhooks deleted
 */
export async function cleanupOldWebhooks(daysOld = 7) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.webhookQueue.deleteMany({
      where: {
        status: {
          in: ["completed", "failed"],
        },
        processedAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`[WEBHOOK QUEUE] Cleaned up ${result.count} old webhooks`);
    return result.count;
  } catch (error) {
    console.error(`[WEBHOOK QUEUE] Error cleaning up old webhooks:`, error);
    throw error;
  }
}

