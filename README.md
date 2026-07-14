#                                                         AeroMoveX

```text
            ✈
          /
         /
───────●────────────────
        AeroMoveX
```
---

> **A modern Electron desktop app for tracking live aircraft using real-time flight data.**


## Overview

**AeroMoveX** is a desktop application built with **Electron.js**, **Node.js**, **HTML**, **CSS**, and **JavaScript** that allows users to monitor live aircraft around the world using the OpenSky Network API.

The application provides a clean desktop interface for searching flights, viewing real-time aircraft information, managing a personal watchlist, and receiving native desktop notifications.


## Features

- Real-time aircraft tracking
- Search flights by callsign
- Display flight information
  - Callsign
  - Country of origin
  - Altitude
  - Speed
  - Heading
- Save favorite flights locally
- Automatic watchlist loading
- Native desktop notifications
- Modern and responsive user interface



## Tech Stack

- Electron.js
- Node.js
- HTML5
- CSS3
- JavaScript (ES6+)
- OpenSky Network API



## Project Structure

```
AeroMoveX/
│
├── assets/
├── data/
│   └── watchlist.json
│
├── renderer/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── main.js
├── preload.js
├── package.json
└── README.md
```

---

## Learning Objectives

This project demonstrates:

- Electron application architecture
- Main Process and Renderer Process
- Inter-Process Communication (IPC)
- Working with external REST APIs
- Local file storage using Node.js
- Native desktop notifications
- Modern JavaScript development



## Future Improvements

- Interactive map visualization
- Flight history
- Dark mode
- Automatic data refresh
- Airport information
- Weather integration
- Flight route visualization



## License

This project is created for educational purposes as part of a **Desktop & Web Programming** course.