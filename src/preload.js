const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadRecipes: () => ipcRenderer.invoke('recipes:load'),
  saveRecipe: (recipe) => ipcRenderer.invoke('recipes:save', recipe),
  deleteRecipe: (id) => ipcRenderer.invoke('recipes:delete', id)
});
