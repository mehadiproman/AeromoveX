#                                                         FocusFlight

```text
            ✈
          /
         /
───────●────────────────
        FocusFlight
```
> **A journey-based focus timer desktop app built with Electron.**
---

## Overview

**FocusFlight** is a desktop productivity application built with **Electron.js**, **Node.js**, **HTML**, **CSS**, and **JavaScript** that transforms study sessions into visual journeys.

Instead of a traditional timer, users select a destination and start a focus session. An animated airplane progresses toward the destination as the timer counts down. Each completed session is saved and contributes to daily and weekly productivity statistics.

## Features

- Focus timer with Start, Pause, Resume, and Reset
- Journey-based progress animation (airplane moves toward destination)
- Multiple destinations (Dhaka → Tokyo, Earth → Mars, etc.)
- Session presets: 25, 50, 90 minutes
- Session history with date and duration
- Daily and weekly statistics with visual bar chart
- Dark and Light theme support
- Native desktop notifications on session completion
- Local JSON data persistence
- Modern, minimal UI inspired by Linear and Raycast

## Tech Stack

- Electron.js
- Node.js
- HTML5
- CSS3
- JavaScript (ES6+)

## Project Structure

```
FocusFlight/
│
├── data/
│   ├── sessions.json
│   └── settings.json
│
├── src/
│   ├── main/
│   │   └── main.js
│   ├── preload/
│   │   └── preload.js
│   └── renderer/
│       ├── index.html
│       ├── scripts/
│       │   ├── app.js
│       │   ├── timer.js
│       │   ├── history.js
│       │   ├── stats.js
│       │   └── settings.js
│       └── styles/
│           └── global.css
│
├── docs/
│   └── planning.md
│
├── package.json
└── README.md
```

---

## Learning Objectives

This project demonstrates:

- Electron application architecture (Main + Renderer + Preload)
- Inter-Process Communication (IPC) — `ipcMain.handle` / `ipcRenderer.invoke`
- Context isolation and secure preload bridge
- Local file I/O using Node.js `fs` module
- Native desktop notifications via Electron
- State management with JavaScript closures (IIFE modules)
- DOM manipulation and event handling
- CSS custom properties for theming
- `setInterval` / `clearInterval` for countdown timers
- Array methods (`filter`, `reduce`, `map`) for data aggregation

---

## How to Run

```bash
npm install
npm start
```

---

## License

This project is created for educational purposes as part of a **Desktop & Web Programming** course.