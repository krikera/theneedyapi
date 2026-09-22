import ServerState from '../models/ServerState.js';

/**
 * Background service that periodically increments the pet's hunger level.
 */

let hungerIntervalId = null;

export const startHungerDaemon = () => {
  const tickIntervalMs = parseInt(process.env.HUNGER_TICK_INTERVAL_MS, 10) || 10800000;
  const hungerIncrement = parseInt(process.env.HUNGER_INCREMENT_PER_TICK, 10) || 5;

  console.log(
    `Hunger service started. Cycle: ${tickIntervalMs / 1000}s, +${hungerIncrement}% per cycle.`
  );

  hungerIntervalId = setInterval(async () => {
    try {
      const updated = await ServerState.incrementHunger(hungerIncrement, 100);
      const currentHunger = updated ? updated.hungerLevel : 100;

      if (currentHunger < 100) {
        console.log(`Hunger level: ${currentHunger}%.`);
      } else {
        console.warn('Hunger at 100%. Data Eater mode is now armed.');
      }
    } catch (err) {
      console.error(`Error updating hunger level: ${err.message}`);
    }
  }, tickIntervalMs);
};

export const stopHungerDaemon = () => {
  if (hungerIntervalId) {
    clearInterval(hungerIntervalId);
    hungerIntervalId = null;
    console.log('Hunger service stopped.');
  }
};
