// Leonida Legends — GTA VI trophy guide & tracker.
// Vanilla ES module: loads data/trophies.json, renders the board, detail drawer
// and roadmap; progress persists in localStorage; export/import as JSON.
// Deep links: #/trophy/<id>, #/roadmap.

const DATA_URL = 'data/trophies.json';
const STORE_KEY = 'gta6-trophy-progress-v1';

const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const KIND_LABEL = {
  story: 'Story', activity: 'Activity', collectible: 'Collectible',
  crime: 'Crime', economy: 'Economy', special: 'Special', completion: 'Completion',
};
const GRADE_TALLY_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

const board = document.getElementById('trophyBoard');
const detailPanel = document.getElementById('detailPanel');
const detailBody = document.getElementById('detailBody');
const closeDetail = document.getElementById('closeDetail');
const roadmapPanel = document.getElementById('roadmapPanel');
const roadmapList = document.getElementById('roadmapList');
const closeRoadmap = document.getElementById('closeRoadmap');
const roadmapBtn = document.getElementById('roadmapBtn');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('search');
const kindFilter = document.getElementById('kindFilter');
const gradeFilter = document.getElementById('gradeFilter');
const sortMode = document.getElementById('sortMode');
const hideEarned = document.getElementById('hideEarned');
const spoilerToggle = document.getElementById('spoilerToggle');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');
const resetBtn = document.getElementById('resetBtn');
const earnedCount = document.getElementById('earnedCount');
const progressFill = document.getElementById('progressFill');
const gradeTally = document.getElementById('gradeTally');

let trophies = [];
let earned = new Set();
let settings = { spoiler: true };

/** Load progress and settings from localStorage, guarded against parse errors. */
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data.earned)) earned = new Set(data.earned.map(String));
    if (data && typeof data.spoiler === 'boolean') settings.spoiler = data.spoiler;
  } catch (err) {
    console.warn('Could not load saved progress:', err);
  }
}

/** Persist progress and settings to localStorage. */
function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ earned: [...earned], spoiler: settings.spoiler }));
  } catch (err) {
    console.warn('Could not save progress:', err);
  }
}

/** Escape user-facing text before it goes into HTML. */
function esc(text) {
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

/** A trophy's guide, shortened for the card peek (first sentence-ish). */
function peekOf(trophy) {
  const guide = trophy.guide || '';
  const dot = guide.indexOf('. ');
  return dot > 0 && dot < 140 ? guide.slice(0, dot + 1) : guide.slice(0, 140);
}

/** Badge markup for a grade. */
function badgeOf(grade) {
  const letter = grade[0].toUpperCase();
  return `<span class="grade-badge ${esc(grade)}" title="${esc(grade)}">${letter}</span>`;
}

/** Tag chips for a trophy card. */
function tagsOf(trophy) {
  const tags = [];
  const kind = trophy.kind;
  if (kind && KIND_LABEL[kind]) tags.push(`<span class="tag kind-${esc(kind)}">${esc(KIND_LABEL[kind])}</span>`);
  if (trophy.missable) tags.push('<span class="tag missable">⚠ Missable</span>');
  if (trophy.hidden) tags.push('<span class="tag">Hidden on PSN</span>');
  if (trophy.count) tags.push(`<span class="tag count">${esc(trophy.count)}</span>`);
  return tags.join('');
}

/** Should this trophy's name/description be spoiler-blurred? */
function isSpoilered(trophy) {
  return settings.spoiler && trophy.kind === 'story' && !earned.has(String(trophy.id));
}

/** Render the whole board from the current filters. */
function renderBoard() {
  const query = searchInput.value.trim().toLowerCase();
  const kind = kindFilter.value;
  const grade = gradeFilter.value;
  const sort = sortMode.value;
  const hide = hideEarned.checked;

  let list = trophies.filter((t) => {
    if (hide && earned.has(String(t.id))) return false;
    if (kind === 'missable') {
      if (!t.missable) return false;
    } else if (kind !== 'all' && t.kind !== kind) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (query) {
      const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  if (sort === 'grade') {
    list.sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.id - b.id);
  } else if (sort === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    list.sort((a, b) => (a.roadmap_stage ?? 99) - (b.roadmap_stage ?? 99) || a.id - b.id);
  }

  board.innerHTML = '';
  for (const t of list) {
    const card = document.createElement('article');
    const isEarned = earned.has(String(t.id));
    card.className = `card${isEarned ? ' earned' : ''}${isSpoilered(t) ? ' spoiler' : ''}`;
    card.dataset.id = t.id;
    card.innerHTML = `
      <div class="card-head">${badgeOf(t.grade)}<h3 class="card-title">${esc(t.name)}</h3></div>
      <p class="card-desc">${esc(t.description)}</p>
      <p class="card-peek"><em>Guide:</em> ${esc(peekOf(t))}</p>
      <div class="card-tags">${tagsOf(t)}</div>
      ${isSpoilered(t) ? '<p class="spoiler-hint">Story spoiler — earn it or toggle the spoiler setting to reveal</p>' : ''}
    `;
    card.addEventListener('click', () => openDetail(t.id));
    board.appendChild(card);
  }

  emptyState.hidden = list.length > 0;
  renderProgress();
}

/** Update the progress bar, counter and grade tally. */
function renderProgress() {
  const total = trophies.length;
  const count = trophies.filter((t) => earned.has(String(t.id))).length;
  earnedCount.textContent = String(count);
  progressFill.style.width = `${total ? (count / total) * 100 : 0}%`;
  const tally = GRADE_TALLY_ORDER.map((g) => {
    const of = trophies.filter((t) => t.grade === g);
    const got = of.filter((t) => earned.has(String(t.id))).length;
    return `${g}: <b>${got}/${of.length}</b>`;
  });
  gradeTally.innerHTML = tally.join(' · ');
}

/** Open the detail drawer for one trophy. */
function openDetail(id) {
  const t = trophies.find((x) => String(x.id) === String(id));
  if (!t) return;
  const isEarned = earned.has(String(t.id));
  const blurred = isSpoilered(t);
  detailBody.innerHTML = `
    <h2>${blurred ? '◆ Story trophy (spoiler-protected)' : esc(t.name)}</h2>
    <p class="detail-desc">${blurred ? 'Earn this trophy or switch the spoiler setting off to see its name and description.' : esc(t.description)}</p>
    <div class="meta-row">${badgeOf(t.grade)}${tagsOf(t)}</div>
    <div class="earn-row">
      <label><input id="earnCheck" type="checkbox" ${isEarned ? 'checked' : ''}> Mark as earned</label>
    </div>
    <h3>Guide</h3>
    <p class="guide-text">${esc(t.guide)}</p>
    <div class="sources">
      <h3>Sources</h3>
      <ul>${(t.sources || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
    </div>
    ${t.missable ? '<p class="warn">⚠ Missable — read the guide before passing this point in the story.</p>' : ''}
  `;
  detailPanel.hidden = false;
  const earnCheck = document.getElementById('earnCheck');
  earnCheck.addEventListener('change', () => {
    if (earnCheck.checked) earned.add(String(t.id));
    else earned.delete(String(t.id));
    saveState();
    renderBoard();
    openDetail(t.id);
  });
  location.hash = `#/trophy/${t.id}`;
}

/** Close the detail drawer. */
function closeDetailPanel() {
  detailPanel.hidden = true;
  if (location.hash.startsWith('#/trophy/')) history.replaceState(null, '', location.pathname);
}

/** Build the roadmap panel from the roadmap_stage field. */
function renderRoadmap() {
  const STAGES = [
    { title: 'Play the story (Chapters 1–5)', why: 'All 18 story trophies are unmissable. Watch only for the Chapter 1 meditation in Positive Mental Attitude — the one missable trophy.' },
    { title: 'Side strands & stranger missions', why: 'Andy, Kenton, Billy, Randy, Tyrone, Bret and 8 stranger strands open up through Chapters 2–4 and all survive into free-roam.' },
    { title: 'Activities & collectibles', why: 'Stunts, shooting ranges, drone races, arcade, vehicles, WAiNK scans, challenges and card sets — most of these feed the 100% checklist anyway.' },
    { title: 'Crime & special one-offs', why: 'Robberies, the VCIA jet, the Rhino tank, the UFO Easter egg and the other quirky one-time trophies.' },
    { title: 'Economy & 100% completion', why: 'Garages, Scooter Bros registrations, laundering and spending — then the 100% completion checklist for A Long Road.' },
    { title: 'Platinum', why: 'Vice Got a Price! unlocks automatically once the other 54 trophies are earned.' },
  ];
  roadmapList.innerHTML = '';
  STAGES.forEach((stage, index) => {
    const inStage = trophies.filter((t) => (t.roadmap_stage ?? 99) === index + 1);
    if (inStage.length === 0) return;
    const li = document.createElement('li');
    const chips = inStage
      .map((t) => {
        const done = earned.has(String(t.id)) ? ' done' : '';
        const miss = t.missable ? ' miss' : '';
        return `<button type="button" class="chip${done}${miss}" data-id="${t.id}">${esc(t.name)}</button>`;
      })
      .join('');
    li.innerHTML = `<h3>${esc(stage.title)}</h3><p class="stage-why">${esc(stage.why)}</p><div class="stage-trophies">${chips}</div>`;
    li.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        roadmapPanel.hidden = true;
        openDetail(chip.dataset.id);
      });
    });
    roadmapList.appendChild(li);
  });
}

/** Export progress as a downloadable JSON file. */
function exportProgress() {
  const payload = {
    game: 'Grand Theft Auto VI',
    exported: new Date().toISOString(),
    earned: [...earned],
    spoiler: settings.spoiler,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

/** Import progress from a JSON file. */
function importProgress(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!Array.isArray(data.earned)) throw new Error('no "earned" array in file');
      earned = new Set(data.earned.map(String));
      if (typeof data.spoiler === 'boolean') settings.spoiler = data.spoiler;
      spoilerToggle.checked = settings.spoiler;
      saveState();
      renderBoard();
      renderRoadmap();
    } catch (err) {
      window.alert(`Could not import progress: ${err.message}`);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

/** Wire up all controls. */
function wireEvents() {
  searchInput.addEventListener('input', renderBoard);
  kindFilter.addEventListener('change', renderBoard);
  gradeFilter.addEventListener('change', renderBoard);
  sortMode.addEventListener('change', renderBoard);
  hideEarned.addEventListener('change', renderBoard);
  spoilerToggle.addEventListener('change', () => {
    settings.spoiler = spoilerToggle.checked;
    saveState();
    renderBoard();
  });
  exportBtn.addEventListener('click', exportProgress);
  importFile.addEventListener('change', importProgress);
  resetBtn.addEventListener('click', () => {
    if (window.confirm('Reset all earned progress?')) {
      earned = new Set();
      saveState();
      renderBoard();
      renderRoadmap();
    }
  });
  closeDetail.addEventListener('click', closeDetailPanel);
  roadmapBtn.addEventListener('click', () => {
    renderRoadmap();
    roadmapPanel.hidden = false;
    location.hash = '#/roadmap';
  });
  closeRoadmap.addEventListener('click', () => {
    roadmapPanel.hidden = true;
    if (location.hash === '#/roadmap') history.replaceState(null, '', location.pathname);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!detailPanel.hidden) closeDetailPanel();
      else if (!roadmapPanel.hidden) closeRoadmap.click();
    }
  });
  window.addEventListener('hashchange', applyHash);
}

/** Apply a deep link (#/trophy/<id>, #/roadmap, #/filter/<value>) on load and change. */
function applyHash() {
  const hash = location.hash;
  if (hash.startsWith('#/trophy/')) {
    const id = hash.slice('#/trophy/'.length);
    if (trophies.some((t) => String(t.id) === id)) openDetail(id);
  } else if (hash === '#/roadmap') {
    renderRoadmap();
    roadmapPanel.hidden = false;
  } else if (hash.startsWith('#/filter/')) {
    const value = decodeURIComponent(hash.slice('#/filter/'.length));
    if (value === 'missable') {
      kindFilter.value = 'missable';
    } else if (value.startsWith('grade:')) {
      gradeFilter.value = value.slice('grade:'.length);
    } else if ([...kindFilter.options].some((o) => o.value === value)) {
      kindFilter.value = value;
    }
    renderBoard();
  }
}

/** Fetch the trophy data, then render everything. */
async function init() {
  loadState();
  spoilerToggle.checked = settings.spoiler;
  wireEvents();
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    trophies = Array.isArray(data) ? data : data.trophies;
  } catch (err) {
    board.innerHTML = `<p class="empty">Could not load trophy data: ${esc(err.message)}</p>`;
    return;
  }
  renderBoard();
  renderRoadmap();
  applyHash();
}

init();
