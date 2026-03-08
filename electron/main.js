import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    backgroundColor: '#121212',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('maximize-change', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('maximize-change', false)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    if (details.reason === 'clean-exit') return
    dialog
      .showMessageBox({
        type: 'error',
        title: 'Renderer Crashed',
        message: `The renderer process terminated unexpectedly (${details.reason}).`,
        buttons: ['Reload', 'Quit'],
      })
      .then(({ response }) => {
        if (response === 0) mainWindow?.webContents.reload()
        else app.quit()
      })
  })

  mainWindow.on('unresponsive', () => {
    dialog
      .showMessageBox({
        type: 'warning',
        title: 'Window Unresponsive',
        message: 'The window is not responding.',
        buttons: ['Wait', 'Reload', 'Quit'],
      })
      .then(({ response }) => {
        if (response === 1) mainWindow?.webContents.reload()
        else if (response === 2) app.quit()
      })
  })
}

ipcMain.handle('window-minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.handle('window-close', () => {
  mainWindow?.close()
})

ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() ?? false
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
