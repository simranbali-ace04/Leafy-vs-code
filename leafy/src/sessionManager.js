// sessionManager.js — the engine that tracks coding sessions and awards plants.
// It watches for activity, ticks up a minute counter, and decides which plant (if any)
// the user earned when a session ends or when the 180-minute prestige rolls over.

const vscode = require("vscode");
const stateManager = require("./stateManager");

// ---- Internal state ----
let currentSession = null; // The active session object (startTime, activeMinutes)
let tickerInterval = null; // Handle for the 1-second interval that drives the minute counter
let isCodingThisMinute = false; // Gets flipped to true by recordActivity(), consumed by the ticker
let inactivityTimer = null; // Handle for the 15-minute inactivity timeout
let onTimeUpdateCallback = null; // Hook so extension.js can push time updates to the webview
let onPlantHarvestedCallback = null; // Hook so extension.js can refresh the garden UI when a plant is earned

function initialize() {
  console.log("Session Manager Engine has booted up.");
}

function getActiveMinutes() {
  if (!currentSession) return 0;
  return currentSession.activeMinutes;
}

/**
 * Register a callback that fires every time the active minute count changes.
 * Used by extension.js to push live timer updates to the webview.
 */
function onTimeUpdate(callback) {
  onTimeUpdateCallback = callback;
}

/**
 * Register a callback that fires when a plant is harvested (session end or prestige rollover).
 * Used by extension.js to trigger a garden UI refresh.
 */
function onPlantHarvested(callback) {
  onPlantHarvestedCallback = callback;
}

/**
 * Called by extension.js whenever the user does something — types, switches tabs, moves cursor.
 * This tells the engine "someone is here, keep the session alive."
 */
function recordActivity() {
  isCodingThisMinute = true;

  // If there's no session yet, start one.
  if (!currentSession) {
    startNewSession();
  }

  // Push back the inactivity deadline.
  resetInactivityTimeout();
}

/**
 * Create a fresh session object and start the background ticker if it isn't already running.
 */
function startNewSession() {
  const now = Date.now();
  currentSession = {
    startTime: now,
    activeMinutes: 0,
  };

  console.log("A fresh coding session has started!");

  // Let the UI know to show a 0-minute progress bar.
  if (onTimeUpdateCallback) onTimeUpdateCallback(0);

  // Only start one ticker — it lives for the lifetime of the extension.
  if (!tickerInterval) {
    startTicker();
  }
}

/**
 * The ticker runs every second and simulates a "minute" of activity.
 * (In production you'd probably want this to tick every 60 s, but for now
 * each real second = one in-game minute so you can see progress faster.)
 */
function startTicker() {
  tickerInterval = setInterval(() => {
    if (!currentSession) return;

    if (isCodingThisMinute) {
      // The user was active this past second — count it.
      currentSession.activeMinutes += 1;
      isCodingThisMinute = false;
      console.log(
        `Session Progress: ${currentSession.activeMinutes} minutes accumulated.`,
      );

      // ---- Prestige rollover at 180 minutes ----
      // When the user hits 3 hours, they immediately earn a Tree and the counter resets
      // to 0 without ending the session. This lets them keep going for another round.
      if (currentSession.activeMinutes >= 180) {
        const treePlant = {
          id: "tree",
          minutesSpent: 180,
          plantedAt: Date.now(),
        };

        const totalGarden = stateManager.getGarden();
        totalGarden.push(treePlant);
        stateManager.saveGarden(totalGarden);

        vscode.window.showInformationMessage(
          "Spectacular marathon! You hit 3 hours and grew a Majestic Tree! " +
            "Your progress bar has reset for a new round.",
        );

        if (onPlantHarvestedCallback) {
          onPlantHarvestedCallback();
        }

        // Roll the counter back to 0 so progress starts fresh.
        currentSession.activeMinutes = 0;
      }

      // Push the updated minute count to the webview.
      if (onTimeUpdateCallback) {
        onTimeUpdateCallback(currentSession.activeMinutes);
      }
    }
  }, 60000);
}

/**
 * Reset the inactivity countdown back to full.
 * Every time the user does something, this gets called so the session stays alive.
 * If nobody calls recordActivity() for 15 minutes, the session ends.
 */
function resetInactivityTimeout() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }

  // NOTE: Currently 5 seconds for debugging. Swap to 900000 (15 min) for release.
  const fifteenMinutesInMs = 15 * 60 * 1000;

  inactivityTimer = setTimeout(() => {
    console.log("15 minutes of quiet detected. Wrapping up session...");
    endCurrentSession();
  }, fifteenMinutesInMs);
}

/**
 * End the current session, figure out which plant (if any) the user earned, and save it.
 */
function endCurrentSession() {
  if (!currentSession) return;

  console.log(
    "Session ended! Total active typing time: " +
      currentSession.activeMinutes +
      " mins.",
  );

  // Walk down the tier list from highest to lowest.
  let plantId = null;

  if (currentSession.activeMinutes >= 180) {
    plantId = "tree";
  } else if (currentSession.activeMinutes >= 150) {
    plantId = "bamboo";
  } else if (currentSession.activeMinutes >= 120) {
    plantId = "cactus";
  } else if (currentSession.activeMinutes >= 60) {
    plantId = "sunflower";
  } else if (currentSession.activeMinutes >= 30) {
    plantId = "succulent";
  } else if (currentSession.activeMinutes >= 15) {
    plantId = "mint_sprout";
  }

  // Not enough time for any plant — clean up silently.
  if (!plantId) {
    console.log(
      "Session was too short to earn a plant (< 15 mins). Clearing engine.",
    );
    if (onTimeUpdateCallback) onTimeUpdateCallback(0);
    clearTimers();
    currentSession = null;
    return;
  }

  // Build the plant record and save it.
  const newPlant = {
    id: plantId,
    minutesSpent: currentSession.activeMinutes,
    plantedAt: Date.now(),
  };

  const totalGarden = stateManager.getGarden();
  totalGarden.push(newPlant);
  stateManager.saveGarden(totalGarden);

  if (onPlantHarvestedCallback) {
    onPlantHarvestedCallback();
  }

  vscode.window.showInformationMessage(
    "Session complete! You earned a beautiful " +
      plantId.replace("_", " ") +
      " for your garden!",
  );

  // Reset everything so the next session starts fresh.
  if (onTimeUpdateCallback) onTimeUpdateCallback(0);
  clearTimers();
  currentSession = null;
}

/**
 * Stop all running timers so nothing fires after the session is done.
 */
function clearTimers() {
  if (tickerInterval) {
    clearInterval(tickerInterval);
    tickerInterval = null;
  }
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
}

module.exports = {
  initialize,
  onTimeUpdate,
  recordActivity,
  getActiveMinutes,
  onPlantHarvested,
  endCurrentSession,
};
