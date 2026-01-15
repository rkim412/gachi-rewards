/**
 * Metafields Migration Configuration
 * Controls whether to use cart metafields exclusively (Phase 4) or with fallback (Phases 1-3)
 */

// Set to true to enable Phase 4 (metafields only, no cart attributes fallback)
// Set to false to keep backward compatibility with cart attributes (Phases 1-3)
export const METAFIELDS_ONLY_MODE = process.env.METAFIELDS_ONLY_MODE === 'true' || false;

// Logging configuration
export const LOG_METAFIELD_USAGE = process.env.LOG_METAFIELD_USAGE !== 'false';
