import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import Tus from '@uppy/tus';

import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

new Uppy()
	.use(Dashboard, { inline: true, target: 'body' })
	.use(Tus, { endpoint: 'https://tusd.tusdemo.net/files/' });

    alert()