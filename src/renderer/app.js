let recipes = [];
let currentId = null;

const listEl = document.getElementById('recipe-list');
const detailEl = document.getElementById('recipe-detail');
const modal = document.getElementById('modal');
const pickModal = document.getElementById('pick-modal');

const COMMON_INGREDIENTS = {
  '肉类': ['猪肉', '五花肉', '排骨', '牛肉', '羊肉', '鸡肉', '鸡腿', '鸡翅', '鸭肉'],
  '蔬菜': ['土豆', '西红柿', '白菜', '青菜', '黄瓜', '茄子', '胡萝卜', '洋葱', '青椒', '豆角', '菠菜', '芹菜', '冬瓜', '南瓜', '西兰花', '生菜', '金针菇', '香菇', '木耳'],
  '蛋奶豆': ['鸡蛋', '鸭蛋', '豆腐', '牛奶', '豆浆', '豆干'],
  '海鲜': ['虾', '鲫鱼', '草鱼', '带鱼', '鱿鱼', '花甲', '螃蟹', '蛤蜊'],
  '调料': ['盐', '酱油', '生抽', '老抽', '料酒', '醋', '糖', '蚝油', '香油', '辣椒', '姜', '蒜', '葱', '花椒', '八角'],
  '主食': ['大米', '面条', '面粉', '饺子皮', '粉条', '粉丝', '年糕'],
  '水果': ['苹果', '香蕉', '梨', '草莓', '橙子', '西瓜', '葡萄']
};

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

function renderPickGrid(cat) {
  const pickGrid = document.getElementById('pick-grid');
  pickGrid.innerHTML = '';
  (COMMON_INGREDIENTS[cat] || []).forEach((name) => {
    const b = document.createElement('button');
    b.textContent = name;
    b.onclick = () => {
      const names = [...document.querySelectorAll('.ing-name')].map((i) => i.value.trim());
      if (!names.includes(name)) {
        document.getElementById('btn-add-ing').click();
        const rows = [...document.querySelectorAll('.ing-row')];
        rows[rows.length - 1].querySelector('.ing-name').value = name;
      }
    };
    pickGrid.appendChild(b);
  });
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

  const ingEl2 = document.getElementById('ingredients');
  const pickGrid = document.getElementById('pick-grid');
  const pickCats = document.getElementById('pick-cats');
  pickCats.innerHTML = '';
  const cats = Object.keys(COMMON_INGREDIENTS);
  cats.forEach((cat, ci) => {
    const b = document.createElement('button');
    b.textContent = cat;
    b.onclick = () => {
      [...pickCats.children].forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      renderPickGrid(cat);
    };
    pickCats.appendChild(b);
  });
  cats[0] && [...pickCats.children][0].classList.add('active') && renderPickGrid(cats[0]);

  document.getElementById('btn-pick-ing').onclick = () => pickModal.classList.remove('hidden');
  document.getElementById('btn-pick-close').onclick = () => pickModal.classList.add('hidden');

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
