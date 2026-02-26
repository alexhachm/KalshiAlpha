const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizeChange: (callback) => {
    const handler = (_event, isMaximized) => callback(isMaximized)
    ipcRenderer.on('maximize-change', handler)
    return () => ipcRenderer.removeListener('maximize-change', handler)
  },
})
