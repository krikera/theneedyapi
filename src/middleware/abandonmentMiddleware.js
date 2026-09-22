import ServerState from '../models/ServerState.js';

/**
 * Middleware that monitors user dormancy.
 * If inactivity exceeds the configured threshold, the server enters an angry state
 * and rejects incoming requests with 403 Forbidden (except POST /api/apologize).
 */
export const abandonmentMiddleware = async (req, res, next) => {
  try {
    const cleanPath = req.path.replace(/\/+$/, '') || '/';

    const state = await ServerState.getOrCreateState();

    const now = Date.now();
    const lastSeen = new Date(state.lastInteraction).getTime();
    const elapsedDormancy = now - lastSeen;
    const thresholdMs = parseInt(process.env.ABANDONMENT_THRESHOLD_MS, 10) || 86400000;

    // Check if dormancy exceeded the threshold
    if (elapsedDormancy > thresholdMs && !state.isAngry) {
      console.warn(
        `Client inactive for ${Math.round(elapsedDormancy / 1000)}s (threshold: ${thresholdMs / 1000}s). Setting isAngry=true`
      );
      state.isAngry = true;
      await ServerState.setAngry(true);
    }

    // If angry, block everything except the apology endpoint
    if (state.isAngry) {
      if (cleanPath === '/api/apologize') {
        return next();
      }

      return res.status(403).json({
        error: "Oh, NOW you need me? Where were you? I'm not talking to you.",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
