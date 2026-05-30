# FFAStrans Webinterface — Claude Code Guidelines

## UI / Frontend

- **The project is on dhtmlx9 (v9.2.4).** Do not use the legacy dhtmlx5 API (`dhtmlx.*`) for any new functionality.
- **For new code use `dhx924`**, loaded from `dependencies/dhtmlx/9.2.4/suite.umd.js`:
  - Messages/toasts: `dhx924.message({ expire: 3000, text: '...' })`
  - Confirms: `dhx924.confirm({ ... })`
- **Pages still referencing `dhx8`** are loading dhtmlx v8.x and should be migrated to v9 when touched. The variable `dhx8` and the legacy `dhtmlx.message()` / `dhtmlx.alert()` wrappers exist only for backward compatibility — do not add new calls to them.

## TypeScript

The project is experimenting with TypeScript in `jobstarter_ts/` as a potential future direction for the frontend. This is a work in progress and not finished — do not treat it as the reference implementation. The canonical jobstarter is still `webinterface/components/jobstarter.html`.

## Architecture

### rest_service

`rest_service/` is a **standalone project**. `server.js` starts it as a child thread, and the webinterface depends on it — but `rest_service` must always be able to run independently without the webinterface. Do not introduce any dependency from `rest_service` back into webinterface code or `server.js`.

### MongoDB (embedded, portable)

MongoDB does not need to be installed by the user. At startup, `server.js` extracts the MongoDB binary and its dependency DLLs from the package to disk, then starts the process as a child process. The port is chosen dynamically from the range `8010–8020` (first free port via portfinder). This makes the database fully portable — no system-level MongoDB installation is ever required.

### Job fetching

`jobfetcher.js` runs on a periodic interval and fetches FFAStrans job data by calling `rest_service`. The `rest_service` reads job data directly from FFAStrans DB files on the filesystem — FFAStrans uses the filesystem as its database, not a traditional DB server. The flow is: `jobfetcher.js` → `rest_service` → FFAStrans filesystem DB files.

**Override mechanism:** Users can replace `jobfetcher.js` entirely by placing their own version in `alternate-server/`. This is a core design principle — it allows the webinterface to display jobs from third-party systems without modifying the main codebase.

**TODO:** Clean up `jobfetcher.js` so it is clear which functions must be implemented by a custom jobfetcher, and document the expected return object shape for each. Currently the interface contract is implicit.
