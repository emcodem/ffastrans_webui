import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import Tus from '@uppy/tus';

import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

//this is only used for building uppy main.js which is what we use in the file uploader on job submitter page

//after changing this file you have to run a build:
//cd C:\dev\ffastrans_webui\webinterface\typescript_client\clientdist && npx webpack --config ../prod.config.js --mode=development

window.Uppy = Uppy;
window.Dashboard = Dashboard;
window.Tus = Tus;
