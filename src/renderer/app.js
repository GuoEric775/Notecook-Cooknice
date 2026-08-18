let recipes = [];
let currentId = null;
let pickTargetRow = null;

const listEl = document.getElementById('recipe-list');
const detailEl = document.getElementById('recipe-detail');
const modal = document.getElementById('modal');
const pickModal = document.getElementById('pick-modal');
const pickGrid = document.getElementById('pick-grid');
const pickCats = document.getElementById('pick-cats');

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
    div.addEventListener('click', () => {
      currentId = r.id;
      renderList();
      renderDetail(r);
    });
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
      <button id="btn-edit">编辑</button>
      <button id="btn-del" class="danger">删除</button>
    </div>`;
  document.getElementById('btn-edit').addEventListener('click', () => openEdit(r.id));
  document.getElementById('btn-del').addEventListener('click', () => removeRecipe(r.id));
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

function showPickModal(targetRow) {
  pickTargetRow = targetRow;
  pickModal.classList.remove('hidden');
}

function renderPickGrid(cat) {
  pickGrid.innerHTML = '';
  (COMMON_INGREDIENTS[cat] || []).forEach((name) => {
    const b = document.createElement('button');
    b.textContent = name;
    b.addEventListener('click', () => {
      if (pickTargetRow) {
        pickTargetRow.querySelector('.ing-name').value = name;
      } else {
        const names = [...document.querySelectorAll('.ing-name')].map((i) => i.value.trim());
        if (!names.includes(name)) {
          document.getElementById('btn-add-ing').click();
          const rows = [...document.querySelectorAll('.ing-row')];
          rows[rows.length - 1].querySelector('.ing-name').value = name;
        }
      }
      pickModal.classList.add('hidden');
    });
    pickGrid.appendChild(b);
  });
}

function initPickCats() {
  pickCats.innerHTML = '';
  const cats = Object.keys(COMMON_INGREDIENTS);
  cats.forEach((cat, ci) => {
    const b = document.createElement('button');
    b.textContent = cat;
    b.classList.toggle('active', ci === 0);
    b.addEventListener('click', () => {
      [...pickCats.children].forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      renderPickGrid(cat);
    });
    pickCats.appendChild(b);
  });
  renderPickGrid(cats[0]);
}
initPickCats();

document.getElementById('btn-pick-close').addEventListener('click', () => pickModal.classList.add('hidden'));

document.getElementById('btn-new').addEventListener('click', () => openEdit(null));

function openEdit(id) {
  const r = id ? recipes.find((x) => x.id === id) : { id: newId(), name: '', category: '', description: '', ingredients: [], steps: [] };
  currentId = r.id;
  document.getElementById('modal-title').textContent = id ? '编辑食谱' : '新建食谱';
  document.getElementById('f-name').value = r.name;
  document.getElementById('f-category').value = r.category;
  document.getElementById('f-desc').value = r.description;

  const ingEl = document.getElementById('ingredients');
  ingEl.innerHTML = '';
  const addIng = (name, amount) => {
    const row = document.createElement('div');
    row.className = 'ing-row';
    row.innerHTML = `<input placeholder="食材" class="ing-name"><input placeholder="用量" class="ing-amount"><button class="pick-row" title="选择常用食材">选</button><button class="danger">×</button>`;
    row.querySelector('.ing-name').value = name || '';
    row.querySelector('.ing-amount').value = amount || '';
    row.querySelector('.pick-row').addEventListener('click', () => showPickModal(row));
    row.querySelector('.danger').addEventListener('click', () => row.remove());
    ingEl.appendChild(row);
  };
  r.ingredients.forEach((i) => addIng(i.name, i.amount));
  document.getElementById('btn-add-ing').addEventListener('click', () => addIng());

  document.getElementById('btn-pick-ing').addEventListener('click', () => showPickModal(null));

  const stepEl = document.getElementById('steps');
  stepEl.innerHTML = '';
  const addStep = (text) => {
    const row = document.createElement('div');
    row.className = 'step-row';
    row.innerHTML = `<input placeholder="步骤描述" class="step-text" style="width:100%"><button class="danger">×</button>`;
    row.querySelector('.step-text').value = text || '';
    row.querySelector('.danger').addEventListener('click', () => row.remove());
    stepEl.appendChild(row);
  };
  r.steps.forEach((s) => addStep(s));
  document.getElementById('btn-add-step').addEventListener('click', () => addStep());

  modal.classList.remove('hidden');
}

document.getElementById('btn-cancel').addEventListener('click', () => modal.classList.add('hidden'));

document.getElementById('btn-save').addEventListener('click', async () => {
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
});

async function removeRecipe(id) {
  if (!confirm('确定删除这个食谱?')) return;
  await window.api.deleteRecipe(id);
  refresh();
}

refresh();
