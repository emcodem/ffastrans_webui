import Uppy from '@uppy/core';
import DragDrop from '@uppy/drag-drop';
import Tus from '@uppy/tus';

import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';


import '@uppy/core/dist/style.min.css';
import '@uppy/drag-drop/dist/style.min.css';

let uppy = new Uppy().use(DragDrop, { target: '#drag-drop' });
uppy.use(Tus, { endpoint: 'https://tusd.tusdemo.net/files/' });