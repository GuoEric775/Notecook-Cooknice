const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { loadRecipes, saveRecipe, deleteRecipe } = require('./storage');

app.setName('我的食谱');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    title: '我的食谱',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.webContents.on('console-message', (_e, level, message) => {
    console.log('[renderer]', message);
  });
  win.webContents.on('render-process-gone', (_e, details) => {
    console.log('[renderer-gone]', details.reason);
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('recipes:load', () => loadRecipes());
ipcMain.handle('recipes:save', (_e, recipe) => saveRecipe(recipe));
ipcMain.handle('recipes:delete', (_e, id) => deleteRecipe(id));
