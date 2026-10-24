# TODO

## Silent hangs on errors in async routes

Express 4 does not handle rejected promises of `async` route handlers: if such a handler throws before sending a response, the request is never answered and the error only ends up in the global unhandledRejection log. Clients using `$.ajax` without a timeout then wait forever and show neither success nor an error.

Seen with `POST /serverconfig_confidential` (Entra setup could not be saved while web authentication was disabled, fixed in `getserverconfig.js`), but every `async` route can behave like this.

- Server: wrap `async` route handlers so errors reach the express error handler and return a 500 (or move to Express 5, which does this natively).
- `webinterface/components/webinterface_admin/azure_setup.html`: add an ajax timeout and show `xhr.responseText` on failure instead of `[object Object]`; migrate the page from `dhx8` to `dhx924` (see CLAUDE.md).
