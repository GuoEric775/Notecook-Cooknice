const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const dataDir = path.join(app.getPath('userData'), 'data');
const recipesFile = path.join(dataDir, 'recipes.json');

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function loadRecipes() {
  ensureDataDir();
  if (!fs.existsSync(recipesFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(recipesFile, 'utf-8'));
  } catch {
    return [];
  }
}

function saveRecipes(recipes) {
  ensureDataDir();
  fs.writeFileSync(recipesFile, JSON.stringify(recipes, null, 2), 'utf-8');
}

function saveRecipe(recipe) {
  const recipes = loadRecipes();
  const index = recipes.findIndex((r) => r.id === recipe.id);
  if (index >= 0) {
    recipes[index] = recipe;
  } else {
    recipes.push(recipe);
  }
  saveRecipes(recipes);
  return recipe;
}

function deleteRecipe(id) {
  const recipes = loadRecipes().filter((r) => r.id !== id);
  saveRecipes(recipes);
  return true;
}

module.exports = { loadRecipes, saveRecipe, deleteRecipe };
