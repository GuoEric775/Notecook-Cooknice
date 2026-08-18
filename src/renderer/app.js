let recipes = [];
let currentId = null;

const listEl = document.getElementById('recipe-list');
const detailEl = document.getElementById('recipe-detail');
const modal = document.getElementById('modal');

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

async function refresh() {
  recipes = await window.api.loadRecipes();
  renderList();
  if (currentId && recipes.some((r) => r.id === currentId)) {
    renderDetail(recipes.find((r) => r.id === currentId));
  } else {
    renderEmpty();
  }
}

function renderList() {
  listEl.innerHTML = '';
  recipes.forEach((r) => {
    const div = document.createElement('div');
    div.className = 'recipe-item' + (r.id === currentId ? ' selected' : '');
    div.innerHTML = `<div class="name">${escapeHtml(r.name)}</div>
      <div class="cat">${escapeHtml(r.category || '未分类')}</div>`;
    div.onclick = () => {
      currentId = r.id;
      renderList();
      renderDetail(r);
    };
    listEl.appendChild(div);
  });
}

function renderEmpty() {
  currentId = null;
  detailEl.className = 'empty';
  detailEl.innerHTML = '<p>选择或新建一个食谱</p>';
}

function renderDetail(r) {
  detailEl.className = '';
  detailEl.innerHTML = `
    <div class="detail-title">${escapeHtml(r.name)}</div>
    <div class="detail-cat">${escapeHtml(r.category || '未分类')}</div>
    ${r.description ? `<div class="detail-desc">${escapeHtml(r.description)}</div>` : ''}
    <div class="detail-section">
      <h3>食材</h3>
      <ul class="detail-ing">${r.ingredients.map((i) => `<li>${escapeHtml(i.name)}${i.amount ? ' - ' + escapeHtml(i.amount) : ''}</li>`).join('')}</ul>
    </div>
    <div class="detail-section">
      <h3>步骤</h3>
      ${r.steps.map((s, idx) => `<div class="detail-step"><b>${idx + 1}.</b> ${escapeHtml(s)}</div>`).join('') || '<p style="color:#aaa">暂无步骤</p>'}
    </div>
    <div class="actions">
      <button onclick="openEdit('${r.id}')">编辑</button>
      <button class="danger" onclick="removeRecipe('${r.id}')">删除</button>
    </div>`;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

document.getElementById('btn-new').onclick = () => openEdit(null);

function openEdit(id) {
  const r = id ? recipes.find((x) => x.id === id) : { id: newId(), name: '', category: '', description: '', ingredients: [], steps: [] };
  currentId = r.id;
  document.getElementById('modal-title').textContent = id ? '编辑食谱' : '新建食谱';
  document.getElementById('f-name').value = r.name;
  document.getElementById('f-category').value = r.category;
  document.getElementById('f-desc').value = r.description;

  const ingEl = document.getElementById('ingredients');
  ingEl.innerHTML = '';
  const addIng = () => {
    const row = document.createElement('div');
    row.className = 'ing-row';
    row.innerHTML = `<input placeholder="食材" class="ing-name"><input placeholder="用量" class="ing-amount"><button class="danger">×</button>`;
    row.querySelector('.danger').onclick = () => row.remove();
    ingEl.appendChild(row);
  };
  r.ingredients.forEach((i) => addIng());
  [...ingEl.querySelectorAll('.ing-row')].forEach((row, i) => {
    row.querySelector('.ing-name').value = r.ingredients[i].name;
    row.querySelector('.ing-amount').value = r.ingredients[i].amount || '';
  });
  document.getElementById('btn-add-ing').onclick = addIng;

  const stepEl = document.getElementById('steps');
  stepEl.innerHTML = '';
  const addStep = () => {
    const row = document.createElement('div');
    row.className = 'step-row';
    row.innerHTML = `<input placeholder="步骤描述" class="step-text" style="width:100%"><button class="danger">×</button>`;
    row.querySelector('.danger').onclick = () => row.remove();
    stepEl.appendChild(row);
  };
  r.steps.forEach(() => addStep());
  [...stepEl.querySelectorAll('.step-row')].forEach((row, i) => {
    row.querySelector('.step-text').value = r.steps[i];
  });
  document.getElementById('btn-add-step').onclick = addStep;

  modal.classList.remove('hidden');
}

document.getElementById('btn-cancel').onclick = () => modal.classList.add('hidden');

document.getElementById('btn-save').onclick = async () => {
  const recipe = {
    id: currentId,
    name: document.getElementById('f-name').value.trim(),
    category: document.getElementById('f-category').value.trim(),
    description: document.getElementById('f-desc').value.trim(),
    ingredients: [...document.querySelectorAll('.ing-row')].map((row) => ({
      name: row.querySelector('.ing-name').value.trim(),
      amount: row.querySelector('.ing-amount').value.trim()
    })).filter((i) => i.name),
    steps: [...document.querySelectorAll('.step-row')].map((row) => row.querySelector('.step-text').value.trim()).filter((s) => s)
  };
  if (!recipe.name) { alert('请填写菜名'); return; }
  await window.api.saveRecipe(recipe);
  modal.classList.add('hidden');
  refresh();
};

async function removeRecipe(id) {
  if (!confirm('确定删除这个食谱?')) return;
  await window.api.deleteRecipe(id);
  refresh();
}

refresh();
