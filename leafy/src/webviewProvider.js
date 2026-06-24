// webviewProvider.js — builds the sidebar "My Garden" UI.
// The provider generates a full HTML page (with embedded CSS + JS) and hands it to VS Code's
// webview system. It also handles two-way messaging: it listens for requests from the frontend
// and pushes updates when plants are earned or the timer ticks.

const vscode = require("vscode");
const stateManager = require("./stateManager");

class LeafyGardenViewProvider {
  /**
   * @param {vscode.ExtensionContext} context
   */
  constructor(context) {
    this._context = context;
    this._view = null; // Set once the sidebar actually opens
  }

  /**
   * VS Code calls this automatically when the user opens the "My Garden" sidebar view.
   * @param {vscode.WebviewView} webviewView
   */
  resolveWebviewView(webviewView) {
    this._view = webviewView;

    // Security setup: we need scripts enabled so the frontend JS can run,
    // and we need to tell VS Code which local files (SVGs) the webview is allowed to load.
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this._context.extensionUri,
        vscode.Uri.joinPath(this._context.extensionUri, "media"),
      ],
    };

    // Generate the full HTML for the sidebar.
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Listen for messages from the frontend JS.
    // Currently the frontend only sends one message: "give me the current progress."
    webviewView.webview.onDidReceiveMessage((message) => {
      if (message.command === "requestCurrentProgress") {
        const sessionManager = require("./sessionManager");
        const activeMins = sessionManager.getActiveMinutes();

        webviewView.webview.postMessage({
          command: "updateTimer",
          minutes: activeMins,
        });
      }
    });

    // Push the current garden data to the frontend so it can render the grid.
    this.updateUI();
  }

  /**
   * Tell the webview to re-fetch the garden array and re-render the grid.
   * Called whenever a plant is earned or the garden is cleared.
   */
  updateUI() {
    if (!this._view) return;

    const gardenData = stateManager.getGarden();

    this._view.webview.postMessage({
      command: "syncGarden",
      data: gardenData,
    });
  }

  /**
   * Build the full HTML page for the sidebar webview.
   * Everything — styles, layout, and JavaScript — is inlined here so the webview
   * is completely self-contained.
   *
   * @param {vscode.Webview} webview
   * @returns {string}
   */
  _getHtmlForWebview(webview) {
    // Turn local SVG file paths into secure webview URIs.
    // These are the URLs the <img> tags will use.
    const plantSvgUris = {
      mint_sprout: webview
        .asWebviewUri(
          vscode.Uri.joinPath(
            this._context.extensionUri,
            "media",
            "plants",
            "mint_sprout.svg",
          ),
        )
        .toString(),
      succulent: webview
        .asWebviewUri(
          vscode.Uri.joinPath(
            this._context.extensionUri,
            "media",
            "plants",
            "succulent.svg",
          ),
        )
        .toString(),
      sunflower: webview
        .asWebviewUri(
          vscode.Uri.joinPath(
            this._context.extensionUri,
            "media",
            "plants",
            "sunflower.svg",
          ),
        )
        .toString(),
      cactus: webview
        .asWebviewUri(
          vscode.Uri.joinPath(
            this._context.extensionUri,
            "media",
            "plants",
            "cactus.svg",
          ),
        )
        .toString(),
      bamboo: webview
        .asWebviewUri(
          vscode.Uri.joinPath(
            this._context.extensionUri,
            "media",
            "plants",
            "bamboo.svg",
          ),
        )
        .toString(),
      tree: webview
        .asWebviewUri(
          vscode.Uri.joinPath(
            this._context.extensionUri,
            "media",
            "plants",
            "tree.svg",
          ),
        )
        .toString(),
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Leafy Garden</title>
  <style>
    /* Use VS Code's own theme colors so the sidebar feels native. */
    body {
      font-family: var(--vscode-font-family);
      padding: 15px;
      color: var(--vscode-foreground);
      background-color: var(--vscode-sideBar-background);
    }
    .garden-header {
      text-align: center;
      margin-bottom: 15px;
    }
    .progress-container {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      height: 8px;
      width: 100%;
      margin: 10px 0 12px 0;
      overflow: hidden;
      display: block;
    }
    .progress-bar {
      background: #007acc;
      height: 100%;
      width: 0%;
      transition: width 0.5s ease-in-out;
    }
    .next-tier-text {
      font-size: 11px;
      opacity: 0.7;
      margin-bottom: 20px;
      text-align: center;
      display: block;
    }
    .grid-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      padding: 5px;
    }
    .grid-cell {
      background: rgba(255, 255, 255, 0.05);
      border: 1px dashed rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      cursor: pointer;
    }
    .plant-img {
      width: 75%;
      height: 75%;
      object-fit: contain;
      animation: sproutWobble 0.5s ease-out;
    }
    @keyframes sproutWobble {
      0%   { transform: scale(0) rotate(-10deg); }
      70%  { transform: scale(1.1) rotate(5deg); }
      100% { transform: scale(1) rotate(0deg); }
    }
  </style>
</head>
<body>
  <div class="garden-header">
    <h3>My Digital Garden</h3>
    <p id="stats-counter">Plants Grown: 0</p>
  </div>

  <div class="progress-container" id="progress-container">
    <div class="progress-bar" id="progress-bar"></div>
  </div>
  <div class="next-tier-text" id="next-tier-text">Next: Mint Sprout (0/15m)</div>

  <!-- The grid cells are generated by JavaScript below. -->
  <div class="grid-container" id="garden-grid"></div>

  <script>
    (function () {
      const vscode = acquireVsCodeApi();
      const statsCounter = document.getElementById('stats-counter');
      const progressBar = document.getElementById('progress-bar');
      const nextTierText = document.getElementById('next-tier-text');
      const gridContainer = document.getElementById('garden-grid');

      // Each plant type maps to its SVG file URI (computed on the Node side above).
      const plantSvgUris = ${JSON.stringify(plantSvgUris)};

      // As soon as the page loads, ask the extension host for our current progress.
      vscode.postMessage({ command: 'requestCurrentProgress' });

      // Listen for messages from the extension host.
      window.addEventListener('message', function (event) {
        var message = event.data;

        // ---- syncGarden: full garden refresh ----
        // Triggered when a plant is earned, cleared, or the webview first opens.
        if (message.command === 'syncGarden') {
          var plants = message.data;
          statsCounter.innerText = 'Plants Grown: ' + plants.length;

          // Wipe the old grid and rebuild from scratch.
          gridContainer.innerHTML = '';

          // Always show a minimum of 9 cells, and grow in multiples of 3.
          var cellsToRender = Math.max(9, Math.ceil((plants.length + 1) / 3) * 3);

          for (var i = 0; i < cellsToRender; i++) {
            var cell = document.createElement('div');
            cell.className = 'grid-cell';

            if (plants[i]) {
              var plant = plants[i];
              var svgUrl = plantSvgUris[plant.id];

              if (svgUrl) {
                var plantDate = new Date(plant.plantedAt).toLocaleDateString(
                  undefined,
                  { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                );
                var cleanName = plant.id.replace('_', ' ').toUpperCase();
                var tooltipText =
                  cleanName + '\\n' +
                  'Focus: ' + plant.minutesSpent + ' mins\\n' +
                  'Grown: ' + plantDate;

                cell.innerHTML =
                  '<img class="plant-img" src="' + svgUrl + '" title="' + tooltipText + '" />';
              }
            }

            gridContainer.appendChild(cell);
          }
        }

        // ---- updateTimer: progress bar refresh ----
        // Fired every time the session manager ticks up a minute (or a mock timer is set).
        if (message.command === 'updateTimer') {
          var mins = message.minutes || 0;

          var target = 15;
          var nextPlant = 'Mint Sprout';

          // Walk down from the highest tier to find where the user is.
          if (mins >= 150) { target = 180; nextPlant = 'Tree'; }
          else if (mins >= 120) { target = 150; nextPlant = 'Bamboo'; }
          else if (mins >= 60) { target = 120; nextPlant = 'Cactus'; }
          else if (mins >= 30) { target = 60; nextPlant = 'Sunflower'; }
          else if (mins >= 15) { target = 30; nextPlant = 'Succulent'; }

          var percentage = (mins / target) * 100;
          progressBar.style.width = percentage + '%';
          nextTierText.innerText = 'Next: ' + nextPlant + ' (' + mins + '/' + target + 'm)';
        }
      });
    })();
  </script>
</body>
</html>`;
  }
}

module.exports = LeafyGardenViewProvider;