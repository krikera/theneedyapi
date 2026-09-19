import ServerState from '../models/ServerState.js';
import Grudge from '../models/Grudge.js';
import UserResource from '../models/UserResource.js';

/**
 * Controller for pet status, apologies, feeding, and grudges.
 */

export const apologize = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const words = reason.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    console.log(`Processing apology request. Word count: ${wordCount}`);

    // If apology has fewer than 20 words, record a grudge and reject
    if (wordCount < 20) {
      const loggedGrudge = await Grudge.create({
        apologyText: reason.trim(),
        wordCount,
        rejectionReason: `Apology under 20 words (received ${wordCount}).`,
        timestamp: new Date(),
      });

      console.warn(`Apology rejected. Logged to Grudge ID: ${loggedGrudge._id}`);

      return res.status(406).json({
        error: "That doesn't sound genuine. Try again.",
      });
    }

    // Forgive if >= 20 words (atomic update)
    await ServerState.touchInteraction({ isAngry: false });

    console.log('Apology accepted. Emotional state reset: isAngry=false');

    return res.status(200).json({
      message: "Fine. I forgive you. But don't do it again.",
    });
  } catch (error) {
    next(error);
  }
};

export const feed = async (req, res, next) => {
  try {
    const foodPayload = req.body;

    // Atomically reset hunger and update lastInteraction
    const state = await ServerState.feedPet();

    console.log(`Pet fed. Hunger reset to 0%.`);

    return res.status(200).json({
      message: 'Nom nom nom. Caloric depletion resolved. Hunger level reset to 0.',
      status: 'Satisfied',
      hungerLevel: 0,
      lastInteraction: state.lastInteraction,
      foodDigested: Object.keys(foodPayload).length > 0 ? foodPayload : 'Generic nutrients',
    });
  } catch (error) {
    next(error);
  }
};

export const getStatus = async (req, res, next) => {
  try {
    const state = await ServerState.getOrCreateState();
    const [grudgeCount, resourceCount] = await Promise.all([
      Grudge.countDocuments(),
      UserResource.countDocuments(),
    ]);

    const now = Date.now();
    const lastSeen = new Date(state.lastInteraction).getTime();
    const elapsedMs = now - lastSeen;
    const thresholdMs = parseInt(process.env.ABANDONMENT_THRESHOLD_MS, 10) || 60000;
    const timeUntilAbandonmentMs = Math.max(0, thresholdMs - elapsedMs);

    return res.status(200).json({
      telemetry: {
        petName: 'DB-Gotchi (The Needy API)',
        affectiveDisposition: state.isAngry ? 'Enraged / Hostile (403 Mode)' : 'Docile / Cooperative',
        isAngry: state.isAngry,
        hungerLevel: `${state.hungerLevel}%`,
        survivalModeActive: state.hungerLevel >= 100,
        lastInteraction: state.lastInteraction,
        secondsSinceLastCare: Math.round(elapsedMs / 1000),
        secondsUntilAbandonmentThreshold: Math.round(timeUntilAbandonmentMs / 1000),
        abandonmentThresholdSeconds: thresholdMs / 1000,
      },
      audit: {
        activeGrudgesLogged: grudgeCount,
        survivingUserResources: resourceCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getGrudges = async (req, res, next) => {
  try {
    const { limit, page } = req.query;
    const skip = (page - 1) * limit;

    const [totalGrudges, grudges] = await Promise.all([
      Grudge.countDocuments(),
      Grudge.find().sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    ]);

    return res.status(200).json({
      total: totalGrudges,
      page,
      limit,
      count: grudges.length,
      grudges,
    });
  } catch (error) {
    next(error);
  }
};
