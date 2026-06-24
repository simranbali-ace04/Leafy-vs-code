// stateManager.js — a thin wrapper around VS Code's built-in storage.
// This keeps the user's garden data safe between restarts.

const vscode = require("vscode");

// We stash the extension context here after activate() calls initialize().
// Every other function grabs it from this variable rather than threading it around.
let extensionContext = null;

/**
 * Store a reference to the extension context so we can read/write global state later.
 * Must be called once from activate() before anything else touches this module.
 * @param {vscode.ExtensionContext} context
 */
function initialize(context) {
  extensionContext = context;
}

/**
 * Read the user's garden from persistent storage.
 * Returns an empty array if nothing has been saved yet (fresh install, or just cleared).
 * @returns {Array} The list of plants the user has grown.
 */
function getGarden() {
  if (!extensionContext) {
    console.error(
      "Leafy State Error: Tried to read garden before initialization.",
    );
    return [];
  }

  // VS Code's globalState works like a tiny key-value store on disk.
  // If the key doesn't exist yet, we default to a fresh, empty garden.
  return extensionContext.globalState.get("leafy_garden_data") || [];
}

/**
 * Replace the saved garden with a new array.
 * Called every time a plant is earned (or when the user clears their garden via dev command).
 * @param {Array} newGardenData
 */
function saveGarden(newGardenData) {
  if (!extensionContext) {
    console.error(
      "Leafy State Error: Tried to save garden before initialization.",
    );
    return;
  }

  extensionContext.globalState.update("leafy_garden_data", newGardenData);
}

module.exports = {
  initialize,
  getGarden,
  saveGarden,
};
