import Uppy from '@uppy/core';
import DragDrop from '@uppy/drag-drop';

import '@uppy/core/dist/style.min.css';
import '@uppy/drag-drop/dist/style.min.css';

new Uppy().use(DragDrop, { target: '#drag-drop' });