import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import Tus from '@uppy/tus';

import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

//after changing this file you have to run a build:
//cd C:\dev\ffastrans_webui\webinterface\typescript_client\clientdist && npx webpack --config ../prod.config.js --mode=development

new Uppy()
	.use(Dashboard, { inline: true, target: 'body' })
	.use(Tus, { endpoint: '/uppy',chunkSize:67108864,parallelUploads :1 });
