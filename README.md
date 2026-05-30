# FFAStrans Webinterface

The official web-based monitoring and control UI for [FFAStrans](https://www.ffastrans.com), the media transcoding automation platform. It provides a browser interface for submitting jobs, tracking running and finished transcoding workflows, browsing files, and managing the FFAStrans farm.

## For Users

### Requirements

- Windows (no dependencies)
- FFAStrans Files (not API)

### Installation

1. Download the latest release ZIP from the [releases page](https://github.com/emcodem/ffastrans_webui/releases) or from the `redist/` folder.
2. Extract to any folder (e.g. `C:\ffastrans\webinterface`).
3. Open the folder — you will find `server.exe`.

### Starting the application

**Double-click** `server.exe`, or run it from the command line:

```
server.exe
```

Once started, open your browser and go to:

```
http://localhost:3002
```

### Installing as a Windows service (runs on boot, no login required)

Run **`service_install.bat` as Administrator**. To remove the service, run `service_uninstall.bat` as Administrator.
If FFAStrans Files are not local, ensure Service Credentials can see the Files

### Configuration

All settings are available through the **Admin** page in the web UI (`http://localhost:3002`). Key settings:

| Setting | Default | Description |
|---|---|---|
| Port | `3002` | Port the web server listens on |
| FFAStrans API host | `localhost` | Host running FFAStrans |
| FFAStrans API port | `65445` | FFAStrans REST API port |
| Upload path | `\\localhost\c$\temp\` | Where uploaded files are staged |
| Authentication | Disabled | Enable Azure AD or Active Directory login |
| HTTPS | Disabled | Enable HTTPS with a certificate |


### Customizing the appearance

There are many builtin options like setting Header name top left or login page welcome message.
See `docs/styling-docs/USER_STYLING_GUIDE.md` for how to change colors, fonts, and layout using the `alternate-server/css/override.css` file.

---

## For Developers

### Requirements

- Node.js 18+
- Windows (the embedded MongoDB binary is Windows x64)

### Setup

```bash
git clone https://github.com/emcodem/ffastrans_webui.git
```
Note that the source code is self contained, no npm install needed.

The `database/` directory must exist before first run:

```
mkdir database\config
```

### Running in development mode

```bash
cd ffastrans_webui
node server.js
```

The server starts at `http://localhost:3002` unless the port has been customized through settings. 

### Frontend build

The client-side bundle is built with Webpack and bundlet to a single .exe using nexe:

```bash
compile_to_dist.bat
```

### Project structure

```
ffastrans_webui/
├── server.js                  # Entry point — Express, Socket.io, auth, DB init
├── node_components/           # Backend modules (routes, DB, auth, player, etc.)
│   ├── common/                # Shared controllers (database, REST API)
│   ├── passport/              # Azure AD and Active Directory auth strategies
│   ├── mongodb_server/        # Embedded MongoDB launcher (mongod.js)
│   ├── views/                 # Express route handlers
│   └── serverconfig_defaults.js  # All config keys and their defaults
├── shared_modules/            # Logger and utilities shared by all modules
├── webinterface/              # Frontend HTML, JS, CSS (served statically)
├── rest_service/              # REST API server - standalone module, could also be packaged and run without webinterface
├── upload_backend/            # Tus resumable upload server
├── alternate-server/          # User can override CSS (css/override.css) and place custom jobfetcher.js in order to show jobs from 3rdparty system in webint
├── tools/                     # Bundled binaries (FFprobe, MPV)
├── database/                  # Runtime data (NeDB config DB, MongoDB job DB)
└── docs/                      # Documentation
```

### Architecture overview

- **Express** serves static files and API routes.
- **Socket.io** pushes real-time job status updates to the browser.
- **NeDB** (`database/config`) stores application configuration.
- **MongoDB** (embedded, auto-started) stores job history in `database/job_db`. The port is auto-selected in the range `8010–8020` unless overridden by `database/mongo_config.json`.
- **Authentication** is optional. When enabled, Passport handles Azure AD (OIDC) or on-premise Active Directory (LDAP) strategies. Set `STATIC_USE_WEB_AUTHENTIFICATION` in the admin UI.

### Building the distributable EXE

```bash
compile_to_dist.bat
```

This uses [nexe](https://github.com/nexe/nexe) to bundle the Node.js runtime and all source files into a single `ffastrans_webui.exe`. The `database/`, `tools/`, `webinterface/`, and `alternate-server/` folders are copied alongside the EXE as the distributable package.