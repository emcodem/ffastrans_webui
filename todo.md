# TODO

## Silent hangs on errors in async routes

Express 4 does not handle rejected promises of `async` route handlers: if such a handler throws before sending a response, the request is never answered and the error only ends up in the global unhandledRejection log. Clients using `$.ajax` without a timeout then wait forever and show neither success nor an error.

Seen with `POST /serverconfig_confidential` (Entra setup could not be saved while web authentication was disabled, fixed in `getserverconfig.js`), but every `async` route can behave like this.

Also seen with `GET /getjpeg` (fixed in `filebrowser.js`): Windows Smart App Control blocked the unsigned ffmpeg.exe, `spawn()` threw synchronously inside a `new Promise` executor, and no response was sent. The jobstarter loads one thumbnail per file, so after 6 hanging requests Chrome's per-host connection limit was used up and every page of the webinterface stayed "pending".

- Server: wrap `async` route handlers so errors reach the express error handler and return a 500 (or move to Express 5, which does this natively).
- `webinterface/components/webinterface_admin/azure_setup.html`: add an ajax timeout and show `xhr.responseText` on failure instead of `[object Object]`; migrate the page from `dhx8` to `dhx924` (see CLAUDE.md).

## rest_service POST /workflows drops user_variables

`updateUserVars()` in `rest_service/api/controllers/workflows.js` is empty, only the original AutoIt code is there as a comment. The `user_variables` that `POST /workflows` requires are accepted but never saved. Investigate how FFAStrans merges imported user variables (variables vs. statics, name collisions, the reserved names `s_success`, `s_error`, `s_source`) and implement it.
