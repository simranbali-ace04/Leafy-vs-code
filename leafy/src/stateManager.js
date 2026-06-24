const vscode = require('vscode');

// This variable will hold our reference to VS Code's extension context
let extensionContext = null;

/**
 * Initializes the state manager by storing the extension context reference.
 * We must call this exactly once inside our main extension activate() function.
 * @param {vscode.ExtensionContext} context 
 */
function initialize(context) {
    extensionContext = context;
}

/**
 * Retrieves the user's saved garden array from local storage.
 * In other cases (like a brand new installation), it returns an empty array [].
 * @returns {Array} List of plants currently in the user's garden
 */
function getGarden() {
    if (!extensionContext) {
        console.error('⚠️ Leafy State Error: Attempted to read garden before initialization.');
        return [];
    }
    
    // Read the data out of VS Code's global state storage. 
    // If it doesn't exist yet, fallback to a fresh empty array.
    return extensionContext.globalState.get('leafy_garden_data') || [];
}

/**
 * Overwrites the saved garden data with a freshly updated array list.
 * @param {Array} newGardenData 
 */
function saveGarden(newGardenData) {
    if (!extensionContext) {
        console.error('⚠️ Leafy State Error: Attempted to save garden before initialization.');
        return;
    }
    
    // Persist the array data cleanly to the user's local disk
    extensionContext.globalState.update('leafy_garden_data', newGardenData);
}

// Export our module functions so that extension.js and our tracking engine can use them
module.exports = {
    initialize,
    getGarden,
    saveGarden
};