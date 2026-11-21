// GTA VI Trophy Guide & Tracker — offline app logic (ES module)
const DATA_URL = './data/trophies.json';
const LS_EARNED = 'gta6_earned';
const LS_SPOILER = 'gta6_spoiler';

const $ = (sel) => document.querySelector(sel);

const state = {
  trophies: [],
  earned: new Set(),
  filter: 'all',
  search: '',
  spoiler: false,
  selectedId: null,
  shot: new URLSearchParams(location.search).get('shot') || 'checklist',
};

function loadEarned() {
  try {
    const raw = localStorage.getItem(LS_EARNED);
    if (raw) state.earned = new Set(JSON.parse(raw));
  } catch { /* ignore corrupt storage */ }
}

function saveEarned() {
  localStorage.setItem(LS_EARNED, JSON.stringify([...state.earned]));
  const hint = $('#saveHint');
  hint.textContent = 'Saved ' + new Date().toLocaleTimeString();
}

function loadSpoiler() {
  state.spoiler = localStorage.getItem(LS_SPOILER) === '1';
  $('#spoilerToggle').checked = state.spoiler;
}

function saveSpoiler() {
  localStorage.setItem(LS_SPOILER, state.spoiler ? '1' : '0');
}

function gradeClass(g) {
  return { platinum: 'grade-platinum', gold: 'grade-gold', silver: 'grade-silver', bronze: 'grade-bronze' }[g] || 'grade-bronze';
}

function gradeLabel(g) {
  return { platinum: 'PLAT', gold: 'GOLD', silver: 'SILVER', bronze: 'BRONZE' }[g] || g.toUpperCase();
}

function isEarned(t) {
  return state.earned.has(t.id);
}

function matchesFilter(t) {
  if (state.filter === 'all') return true;
  if (state.filter === 'missable') return t.missable === true;
  return t.kind === state.filter;
}

function matchesSearch(t) {
  const q = state.search.trim().toLowerCase();
  if (!q) return true;
  return (t.name + ' ' + t.description + ' ' + t.kind).toLowerCase().includes(q);
}

function spoilerHide(t) {
  // Hide story trophy names/descriptions until earned, when spoiler mode is on
  return state.spoiler && t.kind === 'story' && !isEarned(t);
}

function renderList() {
  const ul = $('#trophyList');
  ul.innerHTML = '';
  const visible = state.trophies.filter(t => matchesFilter(t) && matchesSearch(t));
  if (visible.length === 0) {
    ul.innerHTML = '<li class="guide-empty">No trophies match the current filters.</li>';
  }
  for (const t of visible) {
    const li = document.createElement('li');
    li.className = 'trophy-row' + (isEarned(t) ? ' earned' : '') + (state.selectedId === t.id ? ' selected' : '') + (spoilerHide(t) ? ' spoiler-hidden' : '');
    li.dataset.id = t.id;
    li.innerHTML = `
      <div class="grade-badge ${gradeClass(t.grade)}" title="${t.grade}">${gradeLabel(t.grade)}</div>
      <div class="trophy-name">${spoilerHide(t) ? 'Hidden (story spoiler)' : escapeHtml(t.name)}</div>
      <div class="trophy-desc">${spoilerHide(t) ? 'Earn this trophy or disable spoiler mode to reveal.' : escapeHtml(t.description)}</div>
      <div class="trophy-tags">
        <span class="kind-tag">${t.kind}</span>
        ${t.missable ? '<span class="missable-badge">Missable</span>' : ''}
      </div>
      <input type="checkbox" class="earned-check" ${isEarned(t) ? 'checked' : ''} aria-label="Mark ${escapeHtml(t.name)} as earned">
    `;
    ul.appendChild(li);
  }
  renderProgress();
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderProgress() {
  const total = state.trophies.length;
  const done = state.trophies.filter(isEarned).length;
  $('#progressFill').style.width = total ? ((done / total) * 100).toFixed(1) + '%' : '0%';
  $('#progressText').textContent = `${done} / ${total}`;
}

function renderGuide(t) {
  const pane = $('#guidePane');
  pane.innerHTML = `
    <div class="guide-card">
      <h2>${escapeHtml(t.name)}</h2>
      <div class="guide-grade ${gradeClass(t.grade)}" style="border:none;box-shadow:none;padding:0;">${t.grade} · ${t.kind}${t.missable ? ' · missable' : ''}</div>
      <p class="guide-desc">${escapeHtml(t.description)}</p>
      <p class="guide-body">${escapeHtml(t.guide)}</p>
      <div class="guide-meta">
        <span class="kind-tag">Stage ${t.roadmap_stage}</span>
        ${t.missable ? '<span class="missable-badge">Missable</span>' : ''}
      </div>
      <p class="guide-sources">Sources: ${escapeHtml(t.sources)}</p>
    </div>
    <div class="roadmap" id="roadmapSection"></div>
  `;
  renderRoadmap($('#roadmapSection'));
}

function renderRoadmap(container) {
  if (!container) return;
  const stages = {};
  for (const t of state.trophies) {
    (stages[t.roadmap_stage] = stages[t.roadmap_stage] || []).push(t);
  }
  const labels = {
    1: 'Prologue & Chapter 1', 2: 'Chapters 2–3', 3: 'Chapter 4 & side strands',
    4: 'Endgame & cleanup', 5: '100% & platinum',
  };
  let html = '<h3>Roadmap</h3>';
  for (const s of Object.keys(stages).map(Number).sort((a, b) => a - b)) {
    const done = stages[s].filter(isEarned).length;
    html += `<div class="roadmap-stage"><strong>Stage ${s} — ${labels[s] || ''}</strong> (${done}/${stages[s].length})</div>`;
  }
  container.innerHTML = html;
}

function showRoadmap() {
  const pane = $('#guidePane');
  pane.innerHTML = '<div class="roadmap" id="roadmapSection"></div>';
  renderRoadmap($('#roadmapSection'));
}

function selectTrophy(id) {
  state.selectedId = id;
  const t = state.trophies.find(x => x.id === id);
  if (t) renderGuide(t);
  renderList();
}

function exportProgress() {
  const data = {
    game: 'Grand Theft Auto VI',
    exported: new Date().toISOString(),
    earned: [...state.earned],
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (Array.isArray(data.earned)) {
        state.earned = new Set(data.earned.map(Number));
        saveEarned();
        renderList();
        if (state.selectedId != null) {
          const t = state.trophies.find(x => x.id === state.selectedId);
          if (t) renderGuide(t);
        }
        alert('Progress imported: ' + state.earned.size + ' trophies earned.');
      } else {
        alert('Invalid progress file.');
      }
    } catch {
      alert('Could not parse the selected file.');
    }
  };
  reader.readAsText(file);
}

async function init() {
  loadEarned();
  loadSpoiler();

  const res = await fetch(DATA_URL);
  const data = await res.json();
  state.trophies = data.trophies;

  // Filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter;
      renderList();
    });
  });

  // Search
  $('#searchBox').addEventListener('input', (e) => {
    state.search = e.target.value;
    renderList();
  });

  // Spoiler toggle
  $('#spoilerToggle').addEventListener('change', (e) => {
    state.spoiler = e.target.checked;
    saveSpoiler();
    renderList();
  });

  // Export / import
  $('#exportBtn').addEventListener('click', exportProgress);
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) importProgress(e.target.files[0]);
    e.target.value = '';
  });

  // List interactions (delegate: row click opens guide; checkbox toggles earned)
  $('#trophyList').addEventListener('click', (e) => {
    const check = e.target.closest('.earned-check');
    const row = e.target.closest('.trophy-row');
    if (!row) return;
    const id = Number(row.dataset.id);
    if (check) {
      e.stopPropagation();
      if (check.checked) state.earned.add(id); else state.earned.delete(id);
      saveEarned();
      renderList();
      if (state.selectedId === id) {
        const t = state.trophies.find(x => x.id === id);
        if (t) renderGuide(t);
      }
    } else {
      selectTrophy(id);
    }
  });

  // Shot params
  if (state.shot === 'guide') {
    const firstMissable = state.trophies.find(t => t.missable);
    renderList();
    if (firstMissable) selectTrophy(firstMissable.id);
  } else if (state.shot === 'roadmap') {
    renderList();
    showRoadmap();
  } else if (state.shot === 'filters') {
    state.filter = 'missable';
    document.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.filter === 'missable');
    });
    renderList();
  } else {
    renderList();
  }
}

init();
