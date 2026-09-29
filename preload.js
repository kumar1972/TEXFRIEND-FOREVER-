const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('texforeverStorage', {
selectFolder: () =>
ipcRenderer.invoke('select-storage-folder'),

saveData: (data) =>
ipcRenderer.invoke('save-erp-data', data),

loadData: () =>
ipcRenderer.invoke('load-erp-data')
});
