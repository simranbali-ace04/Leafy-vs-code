# Leafy 🪴

Leafy is a lightweight, automated productivity companion built directly into your VS Code sidebar. It tracks your active coding sessions in the background and visualizes your deep-work focus blocks by growing a persistent digital garden. 

There are no manual start/stop buttons, strict pomodoro timers, or rigid alarms. Just open your workspace and start typing—the engine handles the rest.

---

## ⚡ How It Works

Leafy monitors your workspace activity using subtle, non-intrusive internal event listeners. 

* **Active Tracking:** The engine increments your active minutes based on steady interactions like keypresses, cursor position shifts, and active file tab switches.
* **Inactivity Protection:** If you step away from your keyboard or switch tasks for more than **15 minutes**, Leafy automatically stops the session clock, saves your data securely, and resets the progress tracker.
* **The Infinity Loop:** For long deep-work marathons, crossing the 3-hour mark (180 minutes) automatically harvests the final tier plant and safely loops your progress bar back to zero so you can keep growing within the same working session.

---

## 📊 Plant Reward Hierarchy

Your continuous session length determines the exact tier of the plant you sprout on your grid. 

| Focus Duration | Plant Reward |
| :--- | :--- |
| **15 Minutes** | Mint Sprout 🌱 |
| **30 Minutes** | Succulent 🪴 |
| **60 Minutes** | Sunflower 🌻 |
| **120 Minutes** | Cactus 🌵 |
| **150 Minutes** | Bamboo 🎍 |
| **180 Minutes (3 Hours)** | Majestic Tree 🌳 |

---

## 🗺️ Core Features

### 🗂️ Infinite Vertical Grid
Your sidebar view starts as a standard $3 \times 3$ plot. As you complete more focus milestones, the engine adapts dynamically. Once you cross your 9th milestone, the canvas auto-generates new rows, expanding vertically forever to preserve your historical coding history.

### 🔍 Metadata Tooltips
Hovering over any plant on your grid opens a clean, native tooltip displaying its specific identity tier, the exact number of active minutes dedicated to growing it, and a localized timestamp marking when it was planted.

### 🔒 Local Privacy
Your code, telemetry, and keystrokes are entirely your own. Leafy works completely offline. Your cumulative focus session arrays and grid metrics are stored strictly inside your local machine's secure extension state cache—nothing ever touches an external server or cloud.

---

## 📦 Manual Installation Guide (.VSIX)

Leafy is currently in its open community beta phase. You can manually install and run the production build in under a minute:

1. Download the **`leafy-0.0.1.vsix`** file from the latest release assets page.
2. Open **VS Code**.
3. Open the **Extensions View** panel (`Ctrl + Shift + X` or `Cmd + Shift + X`).
4. Click the **`...`** (three dots menu button) located at the top-right corner of the Extensions sidebar header.
5. Choose **Install from VSIX...** from the dropdown menu list.
6. Select the downloaded `leafy-0.0.1.vsix` file from your system directory.

*Note: A direct distribution release onto the official VS Code Extensions Marketplace is planned for the near future.*

---

## 💬 Beta Feedback
As this is the initial rollout of Leafy, your real-world usage data and feedback are incredibly valuable. If you notice any visual stutters, session tracking edge cases, or have feature updates you'd like to see in the upcoming marketplace release, please open an Issue here on GitHub or reach out directly. 

Let's build better focus loops together.
