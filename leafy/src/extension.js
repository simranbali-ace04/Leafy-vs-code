// extension.js — Leafy's main entry point.
// VS Code calls activate() when the extension loads. We set up:
//   - The session tracker (keyboard/tab/cursor listeners)
//   - The sidebar webview (your digital garden)
//   - A bridge between the tracking engine and the UI (progress bar, plant updates)
//   - A few developer commands for testing

const vscode = require("vscode");
const stateManager = require("./stateManager");
const sessionManager = require("./sessionManager");
const LeafyGardenViewProvider = require("./webviewProvider");

// When this is true, the mock timer takes over and live tracking stops updating the bar.
let isSimulationActive = false;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // ---- Bootstrap ----
  stateManager.initialize(context);
  sessionManager.initialize();

  console.log(
    "Leafy has successfully sprouted and is running in the background!",
  );
  console.log("Current Garden Data:", stateManager.getGarden());

  // ---- Sidebar webview ----
  // Register our provider so the "My Garden" view shows up in the sidebar.
  // The provider handles building the HTML and talking to the frontend.
  const gardenProvider = new LeafyGardenViewProvider(context);
  const registeredView = vscode.window.registerWebviewViewProvider(
    "leafy.gardenView",
    gardenProvider,
  );
  context.subscriptions.push(registeredView);

  // ---- Bridge: session timer -> webview progress bar ----
  // Every time the session manager ticks up a minute, we tell the webview
  // to update its progress bar (unless a mock simulation is overriding it).
  sessionManager.onTimeUpdate((currentMinutes) => {
    if (isSimulationActive) return;

    if (gardenProvider._view) {
      gardenProvider._view.webview.postMessage({
        command: "updateTimer",
        minutes: currentMinutes,
      });
    }
  });

  // ---- Bridge: plant harvested -> webview grid refresh ----
  // When the session manager saves a new plant (at session end or prestige rollover),
  // we ask the webview to re-fetch the garden list and re-render the grid.
  sessionManager.onPlantHarvested(() => {
    if (gardenProvider) {
      gardenProvider.updateUI();
    }
  });

  // ---- Activity listeners ----
  // Each of these tells the session manager "the user is doing something."
  // The session manager uses this to keep the session alive and count active minutes.

  // 1. Typing — fires on every keystroke, paste, delete, etc.
  const typingListener = vscode.workspace.onDidChangeTextDocument(() => {
    sessionManager.recordActivity();
  });
  context.subscriptions.push(typingListener);

  // 2. Tab switching — counts when a user clicks between open files.
  const tabListener = vscode.window.onDidChangeActiveTextEditor(() => {
    console.log("User switched file tabs. Resetting inactivity clock...");
    sessionManager.recordActivity();
  });
  context.subscriptions.push(tabListener);

  // 3. Cursor movement — clicking around a file or using arrow keys.
  const cursorListener = vscode.window.onDidChangeTextEditorSelection(
    (event) => {
      // Only count it if the event is from the currently active editor.
      if (event.textEditor === vscode.window.activeTextEditor) {
        sessionManager.recordActivity();
      }
    },
  );
  context.subscriptions.push(cursorListener);

  // ---- Dev commands (only visible in development mode) ----

  // Inject a plant of any tier into the garden (useful for testing the UI layout).
  const mockCommand = vscode.commands.registerCommand(
    "leafy.mockPlant",
    async () => {
      const choice = await vscode.window.showQuickPick(
        ["mint_sprout", "succulent", "sunflower", "cactus", "bamboo", "tree"],
        { placeHolder: "Select a plant tier asset to mock test" },
      );

      if (!choice) return;

      // Map each plant to the minutes you'd normally need to earn it.
      let mockMinutes = 15;
      if (choice === "succulent") mockMinutes = 30;
      else if (choice === "sunflower") mockMinutes = 60;
      else if (choice === "cactus") mockMinutes = 120;
      else if (choice === "bamboo") mockMinutes = 150;
      else if (choice === "tree") mockMinutes = 180;

      const fakePlant = {
        id: choice,
        minutesSpent: mockMinutes,
        plantedAt: Date.now(),
      };

      const currentGarden = stateManager.getGarden();
      currentGarden.push(fakePlant);
      stateManager.saveGarden(currentGarden);

      gardenProvider.updateUI();
      vscode.window.showInformationMessage(
        "Successfully mocked a " + choice.replace("_", " ") + "!",
      );
    },
  );
  context.subscriptions.push(mockCommand);

  // Wipe the garden clean (useful for starting fresh during development).
  const clearCommand = vscode.commands.registerCommand(
    "leafy.clearGarden",
    () => {
      stateManager.saveGarden([]);
      gardenProvider.updateUI();
      vscode.window.showWarningMessage(
        "Garden storage cache cleared successfully!",
      );
    },
  );
  context.subscriptions.push(clearCommand);

  // Manually set the progress bar to a specific minute value without actually coding.
  // Type "reset" to give control back to live tracking.
  const mockTimerCommand = vscode.commands.registerCommand(
    "leafy.mockTimer",
    async () => {
      const input = await vscode.window.showInputBox({
        prompt:
          'Enter simulated minutes (e.g., 25, 45, 75). Type "reset" to turn off simulation.',
      });

      if (!input) return;

      if (input.toLowerCase() === "reset") {
        isSimulationActive = false;
        vscode.window.showInformationMessage(
          "Simulation deactivated. Returning to live tracking!",
        );
        if (gardenProvider._view) {
          gardenProvider._view.webview.postMessage({
            command: "updateTimer",
            minutes: 0,
          });
        }
        return;
      }

      const mins = parseInt(input, 10);
      isSimulationActive = true;

      if (gardenProvider._view) {
        gardenProvider._view.webview.postMessage({
          command: "updateTimer",
          minutes: mins,
        });
      }
    },
  );
  context.subscriptions.push(mockTimerCommand);
}

// VS Code calls this when the extension shuts down.
// We end the current session so any earned plant gets saved properly.
function deactivate() {
  sessionManager.endCurrentSession();
  console.log("Leafy is going to sleep...");
}

module.exports = {
  activate,
  deactivate,
};
