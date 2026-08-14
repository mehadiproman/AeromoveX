<div align="center">

```text
       ______               __     ______ _ _       _     _   
      |  ____|             |  |   |  ____| (_)     | |   | |  
      | |__ ___   ___ _   _| |___ | |__  | |_  __ _| |__ | |_ 
      |  __/ _ \ / __| | | | / __||  __| | | |/ _` | '_ \| __|
      | | | (_) | (__| |_| | \__ \| |    | | | (_| | | | | |_ 
      |_|  \___/ \___|\__,_|_|___/|_|    |_|_|\__, |_| |_|\__|
                                               __/ |          
                                              |___/           
                                AEROMOVEX
```

# AeroMoveX

A Desktop Application for Focus Flight Tracking and Client-Server Sandbox Simulation

</div>

---

## Academic Context

This project is developed as part of **SE 236: Desktop & Web Programming Lab**, supervised by **Partho Chanda** sir.

---

## About the Project

AeroMoveX is a desktop application built with Electron.js that combines two dedicated modules:

1. **Focus Flight**: A journey-based productivity focus timer that visualizes study and work sessions as real-world flight journeys. As users focus, an aircraft travels along an animated flight trajectory from departure to destination, calculating real-time distance, remaining time, and estimated time of arrival while logging local analytics and streaks.
2. **Client-Server Sandbox**: An interactive network protocol simulation environment powered by an embedded Node.js HTTP server. It features a 3-panel terminal interface consisting of a sender client (Client A), a polling consumer client (Client B), and a live server inspector for observing HTTP requests, headers, status codes, and payloads in real time.

---

## Why I Made This

Standard countdown timers and productivity tools often feel static and unmotivating, making long study or work sessions tedious. AeroMoveX solves this by turning time management into an engaging journey with real-time flight telemetry, visual progress arcs, and pilot streak tracking.

In addition, to bridge desktop application engineering with core networking fundamentals, the Client-Server Sandbox was integrated directly into the application. It demonstrates process isolation, Inter-Process Communication (IPC), asynchronous event processing, and HTTP client-server communication within a secure Electron architecture.

---

## Technologies Used

- **Desktop Framework**: Electron.js
- **Runtime Environment**: Node.js
- **Frontend Stack**: Vanilla JavaScript (ES6+), HTML5, Vanilla CSS3
- **Data Persistence**: Local JSON File Storage (`fs` module)
- **Networking**: Node.js HTTP module (`http`)
- **Icons**: Lucide Icons
- **Typography**: Google Fonts (Plus Jakarta Sans, Outfit)

---

## Core Modules

### 1. Focus Flight (Focus & Telemetry Engine)

- **Dynamic Flight Arc**: Renders an animated SVG trajectory with live aircraft coordinates mapped to timer progress percentage.
- **Real-Time Telemetry**: Computes remaining distance in kilometers, elapsed/remaining duration, and dynamic ETA based on airport coordinates.
- **Airport Selection**: Pre-configured domestic and international routes including Dhaka, Chittagong, Sylhet, Cox's Bazar, Dubai, London, Tokyo, Paris, New York, and Singapore.
- **Session Control**: Preset durations (15m, 25m, 45m, 50m, 60m), custom minute inputs, pause/resume controls, and arrival celebration modal.
- **Pilot Analytics**: Real-time streak tracking, daily flight mission logs, weekly distribution bar chart, and circular progress ring.
- **Desktop Alerts**: Native OS notifications triggered upon flight completion.

### 2. Client-Server Sandbox (Protocol Simulator)

- **Embedded HTTP Server**: Runs locally inside the Electron Main process on `http://localhost:3000` with port failover.
- **Client A (Sender)**: Sends custom messages to the server via asynchronous `POST /api/message` requests.
- **Client B (Receiver)**: Periodically polls the server via `GET /api/messages` to display arriving message queues in real time.
- **Server Live Inspector**: Real-time terminal feed logging HTTP methods, headers, client IP addresses, status codes, and syntax-highlighted JSON payloads.

---

## Project Structure

```text
AeromoveX/
├── data/
│   ├── sessions.json           # Focus session history storage
│   └── settings.json           # User configuration preferences
│
├── docs/
│   ├── planning.md             # Engineering requirements and plan
│   └── progress_log.md         # Implementation and development notes
│
├── src/
│   ├── main/
│   │   ├── main.js             # Electron main process & IPC handlers
│   │   └── server.js           # Embedded HTTP server for Sandbox
│   │
│   ├── preload/
│   │   └── preload.js          # Secure contextBridge API definition
│   │
│   └── renderer/
│       ├── index.html          # Main application layout
│       ├── scripts/
│       │   ├── app.js          # App lifecycle and navigation
│       │   ├── timer.js        # Flight arc SVG and countdown engine
│       │   ├── dashboard.js    # Analytics, streaks, and chart renderer
│       │   └── sandbox.js      # 3-panel terminal sandbox controller
│       └── styles/
│           ├── global.css      # Design system tokens and variables
│           ├── timer.css       # Flight telemetry and arc styles
│           ├── stats.css       # Pilot statistics and chart styling
│           └── sandbox.css     # Terminal simulator interface styling
│
├── package.json                # Project dependencies and startup scripts
└── README.md                   # Project documentation
```

---

## Getting Started

### Prerequisites

- **Node.js** (v18.x or higher)
- **npm** (bundled with Node.js)

### Installation & Run

1. Clone the repository:
   ```bash
   git clone https://github.com/mehadiproman/AeromoveX.git
   cd AeromoveX
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

> For development mode, run `npm run dev`.

---

## API & IPC Reference

### Electron IPC Channels (Focus Flight)

| Channel | Method | Parameters | Description |
| :--- | :--- | :--- | :--- |
| `save-session` | `invoke` | `session: Object` | Persists a completed session to `sessions.json` |
| `load-sessions` | `invoke` | None | Loads all saved session records |
| `save-settings` | `invoke` | `settings: Object` | Saves user preferences to `settings.json` |
| `load-settings` | `invoke` | None | Retrieves saved user preferences |
| `show-notification` | `invoke` | `title: String, body: String` | Sends a native desktop operating system notification |
| `console-error` | `send` | `message: String` | Sends renderer errors to the main process console |

### Embedded Server Endpoints (Sandbox)

Base URL: `http://localhost:3000`

| Method | Endpoint | Request Body | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/status` | None | Returns server health, uptime, and message counters |
| `POST` | `/api/message` | `{ "message": "string" }` | Pushes a message into the server memory queue |
| `GET` | `/api/messages` | None | Fetches all stored messages with timestamps |
| `POST` / `DELETE` | `/api/clear` | None | Clears the in-memory message history |

---

## Future Implementations

The following enhancements and features are planned for future releases:

- **Custom Flight Routes & Waypoints**: Allow users to configure custom airport coordinates and multi-stop flight paths.
- **Ambient Audio & Soundscapes**: Optional white noise, cabin hum, and chime audio options during active focus sessions.
- **WebSocket Support in Sandbox**: Add real-time bidirectional WebSocket simulation alongside HTTP polling.
- **Data Export & Cloud Sync**: Export session records to CSV/JSON format and optional cross-device synchronization.
- **Unlockable Aircraft & Themes**: Visual custom themes and aircraft models rewarded for milestone streaks and hours logged.

---

## License

This project is licensed under the MIT License.