// GChat Space Filter — thêm nút "Lọc" kiểu Excel vào header màn Home của Google Chat.
// Google Chat không có class ổn định → bám theo chữ: tìm tiêu đề "Home" nằm cạnh nút "Unread",
// rồi lấy danh sách hội thoại ngay dưới header đó. Tên space = dòng chữ đầu tiên của mỗi dòng.

const HOME_WORDS = ["home", "trang chủ"];
const UNREAD_WORDS = ["unread", "chưa đọc"];
const HIDDEN = "data-gcsf-hidden";
const DEFAULTS = {
  enabled: true, selected: [], selectedGroups: [], known: [],
  sections: {}, sectionOrder: [], dmSection: null,
};

let state = { ...DEFAULTS };
let headerEl = null;
let listEl = null;
let host = null;
let ui = null;
const nameCache = new WeakMap(); // row -> {sig, name}

const norm = (s) => (s || "").normalize("NFC").replace(/\s+/g, " ").trim();
const low = (s) => norm(s).toLowerCase();

// ---------- tìm header + danh sách ----------
function findHeader() {
  if (headerEl && headerEl.isConnected && looksLikeHeader(headerEl)) return headerEl;
  headerEl = null;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!HOME_WORDS.includes(low(n.nodeValue))) continue;
    let el = n.parentElement;
    for (let i = 0; el && i < 6; i++, el = el.parentElement) {
      if (looksLikeHeader(el)) return (headerEl = el);
    }
  }
  return null;
}

function looksLikeHeader(el) {
  const t = low(el.textContent);
  return t.length < 120 && HOME_WORDS.some((w) => t.startsWith(w)) && UNREAD_WORDS.some((w) => t.includes(w));
}

function findList(header) {
  if (listEl && listEl.isConnected && !listEl.contains(header) && document.contains(listEl)) return listEl;
  listEl = null;
  let root = header.parentElement;
  for (let i = 0; root && i < 6; i++, root = root.parentElement) {
    let best = null, bestScore = 1;
    for (const el of root.querySelectorAll("*")) {
      if (el.contains(header) || el.children.length < 2) continue;
      let score = 0;
      for (const k of el.children) {
        if (k.contains(header) || k === host) continue;
        if (norm(k.textContent).length > 10 && k.querySelectorAll("*").length > 5) score++;
      }
      if (score > bestScore) { best = el; bestScore = score; }
    }
    if (best) return (listEl = best);
  }
  return null;
}

// Phân biệt space vs DM/app: preview của space luôn có tên người gửi phía trước ("Nghia Ho: …",
// reply thread "Tuan Nguyen: …"); DM chỉ có nội dung. "You:/Bạn:" có ở cả hai → không tính.
const SELF = ["you", "bạn"];
const SENDER_RE = /^([^:]{1,60}):\s/;
function looksLikeSpace(lines) {
  return lines.slice(1).some((l) => {
    const m = l.match(SENDER_RE);
    return m && !SELF.includes(low(m[1]));
  });
}

function rowInfo(row) {
  const sig = row.textContent.length + "|" + row.textContent.slice(0, 80);
  const c = nameCache.get(row);
  if (c && c.sig === sig) return c;
  if (row.hasAttribute(HIDDEN)) return c || { name: null }; // đang ẩn, innerText không còn xuống dòng
  const lines = (row.innerText || "").split("\n").map(norm).filter(Boolean);
  const info = { sig, name: lines[0] || null, isSpace: looksLikeSpace(lines) };
  nameCache.set(row, info);
  return info;
}

function show(row) {
  if (!row.hasAttribute(HIDDEN)) return;
  const prev = row.getAttribute(HIDDEN);
  row.style.display = prev === "_" ? "" : prev;
  row.removeAttribute(HIDDEN);
}
function hide(row) {
  if (row.hasAttribute(HIDDEN)) return;
  row.setAttribute(HIDDEN, row.style.display || "_");
  row.style.display = "none";
}

// ---------- áp bộ lọc ----------
// ---------- đọc nhóm (section) ở sidebar trái ----------
// Neo vào header "Direct messages", leo lên tới khối chứa tất cả section, mỗi con = 1 section:
// dòng đầu = tên nhóm, các mục bên trong = space. Section thu gọn ("Show all") chỉ thấy 1 phần →
// gộp dồn qua các lần quét (lưu storage), bấm "Show all" 1 lần là đủ.
const DM_WORDS = ["direct messages", "tin nhắn trực tiếp"];
const SKIP_SECTIONS = ["shortcuts", "lối tắt", "reminder", "lời nhắc", "apps", "ứng dụng"];
const NOISE = ["show all", "show less", "hiện tất cả", "ẩn bớt", "thu gọn", "xem tất cả", "now", "bây giờ", "app", "ứng dụng"];
const ITEM_SEL = '[role="listitem"], [role="treeitem"], [role="option"], [role="link"], a[href]';
const lines = (el) => (el.innerText || "").split("\n").map(norm).filter(Boolean);
const isNoise = (l) => NOISE.includes(low(l)) || /^\d+$/.test(l) || /^\d{1,2}:\d{2}/.test(l);

function findSectionsRoot() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!DM_WORDS.includes(low(n.nodeValue))) continue;
    let s = n.parentElement;
    for (let i = 0; s && i < 10; i++, s = s.parentElement) {
      const p = s.parentElement;
      if (!p) break;
      const secs = [...p.children].filter((c) => lines(c).length >= 2);
      if (secs.length >= 3) return p;
    }
  }
  return null;
}

let lastSidebarScan = 0;
function scanSidebar() {
  if (Date.now() - lastSidebarScan < 2000) return;
  lastSidebarScan = Date.now();
  const root = findSectionsRoot();
  if (!root) return;
  const sections = { ...state.sections };
  const order = [];
  let dm = state.dmSection;
  for (const sec of root.children) {
    const ls = lines(sec);
    if (ls.length < 2) continue;
    const name = ls[0];
    if (SKIP_SECTIONS.includes(low(name))) continue;
    let items = [...sec.querySelectorAll(ITEM_SEL)].map((el) => lines(el)[0]).filter(Boolean);
    if (!items.length) items = ls.slice(1);
    items = items.filter((l) => l !== name && !isNoise(l));
    if (DM_WORDS.includes(low(name))) dm = name;
    sections[name] = [...new Set([...(sections[name] || []), ...items])];
    order.push(name);
  }
  if (!order.length) return;
  const patch = { sections, sectionOrder: order, dmSection: dm };
  if (JSON.stringify(patch) !== JSON.stringify({ sections: state.sections, sectionOrder: state.sectionOrder, dmSection: state.dmSection })) {
    Object.assign(state, patch);
    chrome.storage.local.set(patch);
  }
}

function groupIndex() {
  const groupOf = new Map();
  for (const [g, items] of Object.entries(state.sections)) {
    if (g === state.dmSection) continue;
    for (const it of items) if (!groupOf.has(it)) groupOf.set(it, g);
  }
  const dms = new Set(state.sections[state.dmSection] || []);
  return { groupOf, dms };
}

function apply() {
  scanSidebar();
  const header = findHeader();
  if (!header) return;
  ensureUI(header);
  const list = findList(header);
  if (!list) return;

  const active = state.enabled && (state.selected.length > 0 || state.selectedGroups.length > 0);
  const sel = new Set(state.selected);
  const selGroups = new Set(state.selectedGroups);
  const known = new Set(state.known);
  const { groupOf, dms } = groupIndex();
  let newNames = false;

  for (const row of list.children) {
    if (row === host) continue;
    const { name, isSpace } = rowInfo(row);
    if (!name) { show(row); continue; }
    // DM / app: luôn hiện, không đưa vào bộ lọc. Ưu tiên danh sách "Direct messages" ở sidebar;
    // không có thì đoán theo preview (space đã biết thì luôn coi là space).
    const space = !dms.has(name) && (isSpace || known.has(name) || groupOf.has(name));
    if (!space) { show(row); continue; }
    if (!known.has(name)) { known.add(name); state.known.push(name); newNames = true; }
    !active || sel.has(name) || selGroups.has(groupOf.get(name)) ? show(row) : hide(row);
  }
  if (newNames) {
    state.known = state.known.slice(-300);
    chrome.storage.local.set({ known: state.known });
  }
  renderButton();
}

let pending = false;
function schedule() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => { pending = false; apply(); });
}

// ---------- UI kiểu filter Excel ----------
const CSS = `
  :host { all: initial; display: inline-flex; align-items: center; margin-left: 8px; flex: none; }
  .btn { font: var(--font, 500 14px 'Google Sans', system-ui, sans-serif); color: var(--color, #1f1f1f);
         background: var(--bg, #e9eef6); border: none; border-radius: var(--radius, 8px);
         height: var(--h, 32px); padding: 0 12px; cursor: pointer; white-space: nowrap;
         display: inline-flex; align-items: center; gap: 6px; }
  .btn:hover { filter: brightness(0.96); }
  .btn.on { background: #c2e7ff; color: #001d35; }
  .btn svg { width: 18px; height: 18px; fill: currentColor; }
  .panel { position: fixed; z-index: 2147483647; width: 340px; background: #fff; color: #1f1f1f;
           border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,.25); font: 13px system-ui, sans-serif; padding: 10px; }
  .panel[hidden] { display: none; }
  input[type=text] { width: 100%; box-sizing: border-box; padding: 6px 8px; border: 1px solid #c4c7c5; border-radius: 8px; font: inherit; }
  .list { max-height: 380px; overflow: auto; margin: 8px 0; border: 1px solid #e3e3e3; border-radius: 8px; padding: 4px 0; }
  label { display: flex; gap: 8px; align-items: center; padding: 4px 10px; cursor: pointer; }
  label:hover { background: #f1f3f4; }
  label.all { font-weight: 600; border-bottom: 1px solid #eee; }
  label[hidden], .grp[hidden] { display: none; }
  label.gh { font-weight: 600; background: #f8fafd; border-top: 1px solid #eee; position: sticky; top: 0; }
  label.it { padding-left: 30px; }
  .cnt { margin-left: auto; color: #777; font-weight: 400; font-size: 11px; }
  .row { display: flex; gap: 6px; justify-content: flex-end; }
  .row button { font: inherit; padding: 5px 12px; border-radius: 16px; border: 1px solid #c4c7c5; background: #fff; cursor: pointer; }
  .row button.primary { background: #0b57d0; color: #fff; border-color: #0b57d0; }
  .row .left { margin-right: auto; }
`;

const THREAD_WORDS = ["thread", "threads", "luồng", "chuỗi"];

// Nút "Thread" của Google trong header: tìm phần tử có chữ Thread, leo lên tới phần tử con trực tiếp
// cao nhất vẫn chỉ chứa chữ đó (= cả cái nút).
function findThreadBtn(header) {
  for (const el of header.querySelectorAll("*")) {
    if (el === host || !THREAD_WORDS.includes(low(el.textContent))) continue;
    let btn = el;
    while (btn.parentElement && btn.parentElement !== header && THREAD_WORDS.includes(low(btn.parentElement.textContent))) {
      btn = btn.parentElement;
    }
    // Nút có icon dạng chữ (vd. ligature) → chữ "Thread" chỉ là 1 span bên trong; lấy cả nút để không chèn vào trong nút.
    const outer = btn.closest('button, [role="button"], [role="switch"], [role="checkbox"]');
    if (outer && outer !== header && header.contains(outer)) btn = outer;
    return btn;
  }
  return null;
}

// Copy kiểu dáng nút Thread sang nút Lọc để trông cùng bộ.
function copyStyle(src) {
  const cs = getComputedStyle(src);
  const inner = src.querySelector('[role="button"], button') || src;
  const ci = getComputedStyle(inner);
  const pick = (a, b) => (a && a !== "rgba(0, 0, 0, 0)" && a !== "0px" ? a : b);
  host.style.setProperty("--bg", pick(ci.backgroundColor, cs.backgroundColor));
  host.style.setProperty("--radius", pick(ci.borderRadius, cs.borderRadius));
  host.style.setProperty("--h", `${Math.round(inner.getBoundingClientRect().height) || 32}px`);
  host.style.setProperty("--font", ci.font || cs.font);
  host.style.setProperty("--color", ci.color || cs.color);
}

function ensureUI(header) {
  const threadBtn = findThreadBtn(header);
  if (host && host.isConnected && header.contains(host) && (!threadBtn || host.previousElementSibling === threadBtn)) return;
  if (!host) {
    host = document.createElement("span");
    host.id = "gcsf-host";
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${CSS}</style>
      <button class="btn" part="btn"></button>
      <div class="panel" hidden>
        <input type="text" placeholder="Tìm space…">
        <div class="list"></div>
        <div class="row">
          <button class="left clear">Xoá lọc</button>
          <button class="cancel">Huỷ</button>
          <button class="primary ok">OK</button>
        </div>
      </div>`;
    ui = {
      btn: root.querySelector(".btn"), panel: root.querySelector(".panel"),
      search: root.querySelector("input"), list: root.querySelector(".list"),
    };
    // Chặn phím tắt của Google Chat khi gõ trong ô tìm.
    for (const ev of ["keydown", "keyup", "keypress"]) host.addEventListener(ev, (e) => e.stopPropagation());
    ui.btn.addEventListener("click", (e) => { e.stopPropagation(); ui.panel.hidden ? openPanel() : closePanel(); });
    ui.search.addEventListener("input", filterList);
    root.querySelector(".ok").addEventListener("click", () => { commit(); closePanel(); });
    root.querySelector(".cancel").addEventListener("click", closePanel);
    root.querySelector(".clear").addEventListener("click", () => { save({ selected: [], selectedGroups: [] }); closePanel(); });
    document.addEventListener("click", (e) => {
      if (ui && !ui.panel.hidden && !e.composedPath().includes(host)) closePanel();
    }, true);
  }
  if (threadBtn) {
    threadBtn.after(host);
    copyStyle(threadBtn);
  } else {
    header.appendChild(host);
  }
  renderButton();
}

function renderButton() {
  if (!ui) return;
  const parts = state.enabled
    ? [...state.selectedGroups, ...(state.selected.length ? [`${state.selected.length} space`] : [])]
    : [];
  let label = parts.join(", ");
  if (label.length > 28) label = label.slice(0, 27) + "…";
  // Icon phễu lọc (Material "filter_alt") cho đồng bộ với icon của nút Thread.
  ui.btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39A.998.998 0 0 0 18.95 4H5.04c-.83 0-1.3.95-.79 1.61z"/></svg>${label ? `Lọc: ${label}` : "Lọc"}`;
  ui.btn.title = parts.length ? `Đang lọc: ${[...state.selectedGroups, ...state.selected].join(", ")}` : "Lọc space";
  ui.btn.classList.toggle("on", parts.length > 0);
}

const OTHER = "Khác";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

// Nhóm theo section ở sidebar; space chỉ thấy ở Home mà không thuộc section nào → "Khác".
function buildGroups() {
  const { groupOf, dms } = groupIndex();
  const order = [...state.sectionOrder, ...Object.keys(state.sections)]
    .filter((g, i, a) => a.indexOf(g) === i && g !== state.dmSection && state.sections[g]);
  const groups = order.map((g) => ({ name: g, items: [...state.sections[g]] })).filter((g) => g.items.length);
  const other = [...new Set([...state.known, ...state.selected])].filter((n) => !groupOf.has(n) && !dms.has(n));
  if (other.length) groups.push({ name: OTHER, items: other.sort((a, b) => a.localeCompare(b, "vi")) });
  return groups;
}

function openPanel() {
  const groups = buildGroups();
  const sel = new Set(state.selected);
  const selG = new Set(state.selectedGroups);
  const noFilter = sel.size === 0 && selG.size === 0;
  ui.list.innerHTML =
    `<label class="all"><input type="checkbox" class="all-cb"> (Chọn tất cả)</label>` +
    groups.map((g) => `<div class="grp" data-group="${esc(g.name)}">
        <label class="gh"><input type="checkbox" class="g-cb"> ${esc(g.name)} <span class="cnt">${g.items.length}</span></label>
        ${g.items.map((n) => `<label class="it"><input type="checkbox" data-name="${esc(n)}" ${
          noFilter || sel.has(n) || selG.has(g.name) ? "checked" : ""}> ${esc(n)}</label>`).join("")}
      </div>`).join("");

  const allCb = ui.list.querySelector(".all-cb");
  const visible = (root) => [...root.querySelectorAll("label.it:not([hidden]) input[data-name]")];
  const tri = (cb, boxes) => {
    const c = boxes.filter((x) => x.checked).length;
    cb.checked = c > 0 && c === boxes.length; cb.indeterminate = c > 0 && c < boxes.length;
  };
  const syncAll = () => {
    for (const grp of ui.list.querySelectorAll(".grp")) tri(grp.querySelector(".g-cb"), visible(grp));
    tri(allCb, visible(ui.list));
  };
  ui.list.onchange = (e) => {
    const t = e.target;
    if (t === allCb) visible(ui.list).forEach((x) => (x.checked = t.checked));
    else if (t.classList.contains("g-cb")) visible(t.closest(".grp")).forEach((x) => (x.checked = t.checked));
    syncAll();
  };
  ui.syncAll = syncAll;
  ui.search.value = "";
  syncAll();

  const r = ui.btn.getBoundingClientRect();
  ui.panel.style.top = `${r.bottom + 6}px`;
  ui.panel.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - 348))}px`;
  ui.panel.hidden = false;
  ui.search.focus();
}

function filterList() {
  const q = low(ui.search.value);
  for (const grp of ui.list.querySelectorAll(".grp")) {
    const gMatch = q && low(grp.dataset.group).includes(q); // gõ tên nhóm → hiện cả nhóm
    let any = false;
    for (const lb of grp.querySelectorAll("label.it")) {
      lb.hidden = !!q && !gMatch && !low(lb.textContent).includes(q);
      any = any || !lb.hidden;
    }
    grp.hidden = !any;
  }
  ui.syncAll && ui.syncAll();
}

function commit() {
  const all = [...ui.list.querySelectorAll("input[data-name]")];
  if (all.every((x) => x.checked)) return save({ selected: [], selectedGroups: [] });
  const selectedGroups = [];
  const selected = [];
  for (const grp of ui.list.querySelectorAll(".grp")) {
    const boxes = [...grp.querySelectorAll("input[data-name]")];
    // Tick đủ cả nhóm (trừ "Khác") → lưu theo nhóm, space mới thêm vào nhóm đó sau này cũng tự hiện.
    if (grp.dataset.group !== OTHER && boxes.length && boxes.every((x) => x.checked)) selectedGroups.push(grp.dataset.group);
    else selected.push(...boxes.filter((x) => x.checked).map((x) => x.dataset.name));
  }
  save({ selected: [...new Set(selected)], selectedGroups });
}

function closePanel() { if (ui) ui.panel.hidden = true; }

function save(patch) {
  Object.assign(state, patch);
  chrome.storage.local.set(patch);
  apply();
}

// ---------- khởi động ----------
const DATA_VERSION = 2; // v2: danh sách chỉ gồm space (v1 lẫn cả DM) → xoá danh sách cũ, giữ lựa chọn
chrome.storage.local.get({ ...DEFAULTS, v: 1 }, (v) => {
  if (v.v !== DATA_VERSION) {
    v.known = [...v.selected];
    chrome.storage.local.set({ known: v.known, v: DATA_VERSION });
  }
  state = { ...DEFAULTS, ...v };
  apply();
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  for (const [k, { newValue }] of Object.entries(changes)) state[k] = newValue ?? DEFAULTS[k];
  apply();
});
