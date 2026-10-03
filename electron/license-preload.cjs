const {
  contextBridge,
  ipcRenderer,
} = require('electron');

contextBridge.exposeInMainWorld('licenseAPI', {
  getMachineId: () =>
    ipcRenderer.invoke('license:get-machine-id'),

  activate: (licenseKey) =>
    ipcRenderer.invoke(
      'license:activate',
      licenseKey,
    ),
});