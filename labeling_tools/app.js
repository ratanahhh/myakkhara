/* ==========================================================================
   MyAkkhara — Draw & Label  ·  app.js

   Phase 1 (Draw):   draw, move, resize and delete boxes around handwritten lines.
   Phase 2 (Label):  see each cropped line big, type its text, press Enter.
   Export:           one ZIP with every cropped line image + labels.csv.

   Sections:
      1. Constants
      2. DOM references
      3. App state
      4. Small helpers
      5. Loading page photos
      6. Switching between phases
      7. Draw phase: canvas and zoom
      8. Draw phase: rendering
      9. Draw phase: box geometry (hit testing)
     10. Draw phase: mouse interaction
     11. Draw phase: sidebar and deleting
     12. Label phase
     13. Export
     14. Start-up

   COORDINATES: box positions are stored in REAL image pixels (x, y, w, h).
   state.scale converts to screen pixels:   screen = real * scale
   ========================================================================== */


/* ---------- 1. Constants ---------- */

const COLORS = {
  box: '#2E5C4E',
  selectedBox: '#C9622A',
  handleFill: '#FFFFFF',
};

const HANDLE_SIZE = 8;       // size of each resize handle, in screen pixels
const MIN_BOX_SIZE = 12;     // smallest allowed box, in REAL image pixels (see finishNewBox)
const MIN_DRAG_PX = 10;      // a drag shorter than this (screen px) is treated as a plain click

const MAX_FIT_WIDTH = 1400;  // when a page is first shown, fit it within this width...
const MAX_FIT_SCALE = 1.5;   // ...and never enlarge small images by more than this
const ZOOM = { min: 0.2, max: 4, buttonStep: 1.25, wheelStep: 1.1 };

const JSZIP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';

const SUBTITLES = {
  draw: 'Phase 1: draw boxes around every line first, then switch to Label to type them all.',
  label: 'Phase 2: type the text for each line, one at a time.',
};

// Which mouse cursor to show over each resize handle
const HANDLE_CURSORS = {
  nw: 'nwse-resize', se: 'nwse-resize',
  ne: 'nesw-resize', sw: 'nesw-resize',
  n: 'ns-resize', s: 'ns-resize',
  e: 'ew-resize', w: 'ew-resize',
};


/* ---------- 2. DOM references ---------- */

const dom = {
  fileInput:     document.getElementById('fileInput'),
  loadBtn:       document.getElementById('loadBtn'),
  loadBtn2:      document.getElementById('loadBtn2'),
  exportBtn:     document.getElementById('exportBtn'),
  zoomInBtn:     document.getElementById('zoomInBtn'),
  zoomOutBtn:    document.getElementById('zoomOutBtn'),
  zoomLabel:     document.getElementById('zoomLabel'),
  deleteBoxBtn:  document.getElementById('deleteBoxBtn'),
  drawPhaseBtn:  document.getElementById('drawPhaseBtn'),
  labelPhaseBtn: document.getElementById('labelPhaseBtn'),
  headerSub:     document.getElementById('headerSub'),
  canvasPane:    document.getElementById('canvasPane'),
  sidebar:       document.getElementById('sidebar'),
  pageList:      document.getElementById('pageList'),
};


/* ---------- 3. App state ---------- */

const state = {
  pages: [],            // [{ pageId, img, boxes: [{ x, y, w, h, text }] }]
  currentPageIdx: 0,
  phase: 'draw',        // 'draw' | 'label'

  scale: 1,             // current zoom: screen pixels per real image pixel
  fitScale: 1,          // the zoom that fits the whole page on screen
  selectedBoxIdx: -1,   // index into the current page's boxes, or -1

  labelQueue: [],       // [{ pageIdx, boxIdx }] in the order boxes get labeled
  labelCursor: 0,       // position inside labelQueue
};

let canvas = null;      // the <canvas> shown in the Draw phase (re-created per page)
let ctx = null;

// The mouse interaction in progress, or null when idle. One of:
//   { mode: 'new',    startX, startY, curX, curY }        drawing a brand-new box (screen px)
//   { mode: 'move',   mouseStart: {x, y}, boxStart: {x, y} }
//   { mode: 'resize', handle, anchor: {left, top, right, bottom} }   (real image px)
let drag = null;


/* ---------- 4. Small helpers ---------- */

const currentPage = () => state.pages[state.currentPageIdx];

const selectedBox = () =>
  state.selectedBoxIdx === -1 ? null : currentPage().boxes[state.selectedBoxIdx];

const totalBoxCount = () =>
  state.pages.reduce((sum, page) => sum + page.boxes.length, 0);

const clamp = (value, low, high) => Math.min(Math.max(value, low), high);

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/** Cut one box out of its page photo. Returns a new <canvas> holding just that crop. */
function cropBox(page, box) {
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(box.w));
  out.height = Math.max(1, Math.round(box.h));
  out.getContext('2d').drawImage(
    page.img, box.x, box.y, box.w, box.h,   // source rectangle (real image px)
    0, 0, out.width, out.height             // destination
  );
  return out;
}

/** Enable/disable toolbar buttons to match the current phase and selection. */
function updateToolbar() {
  const inDrawPhase = state.phase === 'draw' && state.pages.length > 0;
  dom.zoomInBtn.disabled = !inDrawPhase;
  dom.zoomOutBtn.disabled = !inDrawPhase;
  dom.deleteBoxBtn.disabled = !(inDrawPhase && state.selectedBoxIdx !== -1);
  dom.exportBtn.disabled = totalBoxCount() === 0;
}

function selectBox(index) {
  state.selectedBoxIdx = index;
  updateToolbar();
}


/* ---------- 5. Loading page photos ---------- */

function loadPageImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({
      pageId: file.name.replace(/\.[^.]+$/, ''),   // filename without extension
      img,
      boxes: [],
    });
    img.onerror = () => reject(new Error(`Could not read the image "${file.name}".`));
    img.src = URL.createObjectURL(file);
  });
}

async function onFilesChosen(event) {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  try {
    const newPages = await Promise.all(files.map(loadPageImage));  // keeps the chosen order
    state.currentPageIdx = state.pages.length;                     // jump to the first new page
    state.pages.push(...newPages);
    enterDrawPhase();
  } catch (error) {
    alert(error.message);
  }
  event.target.value = '';   // lets you pick the same file again later
}


/* ---------- 6. Switching between phases ---------- */

function enterDrawPhase() {
  if (state.pages.length === 0) return;

  state.phase = 'draw';
  dom.drawPhaseBtn.classList.add('active');
  dom.labelPhaseBtn.classList.remove('active');
  dom.headerSub.textContent = SUBTITLES.draw;
  dom.sidebar.hidden = false;

  setupDrawCanvas();
  renderPageList();
}

function enterLabelPhase() {
  if (state.pages.length === 0) return;

  buildLabelQueue();
  if (state.labelQueue.length === 0) {
    alert('No boxes drawn yet. Go back to Draw and mark some lines first.');
    return;
  }

  state.phase = 'label';
  selectBox(-1);
  dom.labelPhaseBtn.classList.add('active');
  dom.drawPhaseBtn.classList.remove('active');
  dom.headerSub.textContent = SUBTITLES.label;
  dom.sidebar.hidden = true;

  state.labelCursor = 0;
  renderLabelCard();
}


/* ---------- 7. Draw phase: canvas and zoom ---------- */

function setupDrawCanvas() {
  const page = currentPage();
  selectBox(-1);

  // Start zoomed so the whole page fits on screen
  const availableWidth = Math.min(MAX_FIT_WIDTH, dom.canvasPane.clientWidth - 40);
  state.fitScale = Math.min(MAX_FIT_SCALE, availableWidth / page.img.naturalWidth);
  state.scale = state.fitScale;

  dom.canvasPane.innerHTML = '<div class="canvas-wrap"><canvas id="pageCanvas"></canvas></div>';
  canvas = document.getElementById('pageCanvas');
  ctx = canvas.getContext('2d');

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  resizeCanvasToScale();
  redraw();
  updateZoomLabel();
}

/** Make the canvas exactly as big as the page photo at the current zoom. */
function resizeCanvasToScale() {
  const img = currentPage().img;
  canvas.width = img.naturalWidth * state.scale;    // (setting width/height also clears the canvas)
  canvas.height = img.naturalHeight * state.scale;
}

function updateZoomLabel() {
  dom.zoomLabel.textContent = Math.round(state.scale * 100) + '%';
}

function setZoom(newScale) {
  state.scale = clamp(newScale, ZOOM.min, ZOOM.max);
  resizeCanvasToScale();
  updateZoomLabel();
  redraw();
}

function onWheel(event) {
  if (!event.ctrlKey && !event.metaKey) return;   // plain scrolling keeps scrolling the page
  event.preventDefault();
  const factor = event.deltaY < 0 ? ZOOM.wheelStep : 1 / ZOOM.wheelStep;
  setZoom(state.scale * factor);
}


/* ---------- 8. Draw phase: rendering ---------- */

function redraw() {
  const page = currentPage();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(page.img, 0, 0, canvas.width, canvas.height);

  page.boxes.forEach((box, index) => {
    drawBox(box, index, index === state.selectedBoxIdx);
  });

  if (drag && drag.mode === 'new') {
    drawNewBoxPreview();
  }
}

function drawBox(box, index, isSelected) {
  const rect = toScreenRect(box);
  const color = isSelected ? COLORS.selectedBox : COLORS.box;

  ctx.strokeStyle = color;
  ctx.lineWidth = isSelected ? 2.5 : 2;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

  ctx.fillStyle = color;
  ctx.font = '12px sans-serif';
  ctx.fillText('line' + String(index + 1).padStart(2, '0'), rect.x + 4, rect.y + 14);

  if (isSelected) {
    drawHandles(box);
  }
}

function drawHandles(box) {
  ctx.fillStyle = COLORS.handleFill;
  ctx.strokeStyle = COLORS.selectedBox;
  ctx.lineWidth = 1.5;
  for (const handle of getHandlePositions(box)) {
    const left = handle.x - HANDLE_SIZE / 2;
    const top = handle.y - HANDLE_SIZE / 2;
    ctx.fillRect(left, top, HANDLE_SIZE, HANDLE_SIZE);
    ctx.strokeRect(left, top, HANDLE_SIZE, HANDLE_SIZE);
  }
}

function drawNewBoxPreview() {
  ctx.strokeStyle = COLORS.selectedBox;
  ctx.lineWidth = 2;
  ctx.strokeRect(
    Math.min(drag.startX, drag.curX),
    Math.min(drag.startY, drag.curY),
    Math.abs(drag.curX - drag.startX),
    Math.abs(drag.curY - drag.startY)
  );
}


/* ---------- 9. Draw phase: box geometry (hit testing) ---------- */

/** A box in screen pixels (for drawing and mouse tests). */
function toScreenRect(box) {
  return {
    x: box.x * state.scale,
    y: box.y * state.scale,
    w: box.w * state.scale,
    h: box.h * state.scale,
  };
}

/** The 8 resize handles of a box: 4 corners + 4 edge midpoints, in screen pixels. */
function getHandlePositions(box) {
  const r = toScreenRect(box);
  const midX = r.x + r.w / 2;
  const midY = r.y + r.h / 2;
  return [
    { name: 'nw', x: r.x,       y: r.y },
    { name: 'n',  x: midX,      y: r.y },
    { name: 'ne', x: r.x + r.w, y: r.y },
    { name: 'e',  x: r.x + r.w, y: midY },
    { name: 'se', x: r.x + r.w, y: r.y + r.h },
    { name: 's',  x: midX,      y: r.y + r.h },
    { name: 'sw', x: r.x,       y: r.y + r.h },
    { name: 'w',  x: r.x,       y: midY },
  ];
}

/** Name of the handle under the mouse, or null. */
function getHandleAt(box, mouseX, mouseY) {
  for (const handle of getHandlePositions(box)) {
    if (Math.abs(mouseX - handle.x) <= HANDLE_SIZE && Math.abs(mouseY - handle.y) <= HANDLE_SIZE) {
      return handle.name;
    }
  }
  return null;
}

function pointInBox(box, mouseX, mouseY) {
  const r = toScreenRect(box);
  return mouseX >= r.x && mouseX <= r.x + r.w && mouseY >= r.y && mouseY <= r.y + r.h;
}

/** Index of the top-most box under the mouse, or -1. */
function findBoxAt(boxes, mouseX, mouseY) {
  for (let i = boxes.length - 1; i >= 0; i--) {
    if (pointInBox(boxes[i], mouseX, mouseY)) return i;
  }
  return -1;
}


/* ---------- 10. Draw phase: mouse interaction ---------- */

/** Mouse position relative to the canvas's top-left corner, in screen pixels. */
function getMousePos(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left - canvas.clientLeft,
    y: event.clientY - rect.top - canvas.clientTop,
  };
}

function onMouseDown(event) {
  const { x, y } = getMousePos(event);
  const boxes = currentPage().boxes;

  // 1) If a box is selected, its handles and body take priority
  const selected = selectedBox();
  if (selected) {
    const handle = getHandleAt(selected, x, y);
    if (handle) return startResize(selected, handle);
    if (pointInBox(selected, x, y)) return startMove(selected, x, y);
  }

  // 2) Clicking some other box selects it (and lets you drag it right away)
  const hitIndex = findBoxAt(boxes, x, y);
  if (hitIndex !== -1) {
    selectBox(hitIndex);
    startMove(boxes[hitIndex], x, y);
    redraw();
    return;
  }

  // 3) Clicking empty space starts drawing a new box
  selectBox(-1);
  startNewBox(x, y);
  redraw();
}

function startNewBox(x, y) {
  drag = { mode: 'new', startX: x, startY: y, curX: x, curY: y };
}

function startMove(box, x, y) {
  drag = { mode: 'move', mouseStart: { x, y }, boxStart: { x: box.x, y: box.y } };
}

function startResize(box, handle) {
  drag = {
    mode: 'resize',
    handle,
    // The edges that stay put while you drag (real image px)
    anchor: { left: box.x, top: box.y, right: box.x + box.w, bottom: box.y + box.h },
  };
}

function onMouseMove(event) {
  const { x, y } = getMousePos(event);

  if (!drag) {
    updateHoverCursor(x, y);
    return;
  }

  if (drag.mode === 'new') {
    drag.curX = x;
    drag.curY = y;
  } else if (drag.mode === 'move') {
    moveSelectedBox(x, y);
  } else if (drag.mode === 'resize') {
    resizeSelectedBox(x, y);
  }
  redraw();
}

/** Before clicking: show a resize/move cursor when hovering the selected box. */
function updateHoverCursor(x, y) {
  const selected = selectedBox();
  let cursor = 'crosshair';
  if (selected) {
    const handle = getHandleAt(selected, x, y);
    if (handle) cursor = HANDLE_CURSORS[handle];
    else if (pointInBox(selected, x, y)) cursor = 'move';
  }
  canvas.style.cursor = cursor;
}

function moveSelectedBox(mouseX, mouseY) {
  const box = selectedBox();
  const img = currentPage().img;
  const dx = (mouseX - drag.mouseStart.x) / state.scale;
  const dy = (mouseY - drag.mouseStart.y) / state.scale;

  // Keep the box inside the photo (a box hanging off the edge would crop as blank)
  box.x = clamp(drag.boxStart.x + dx, 0, Math.max(0, img.naturalWidth - box.w));
  box.y = clamp(drag.boxStart.y + dy, 0, Math.max(0, img.naturalHeight - box.h));
}

function resizeSelectedBox(mouseX, mouseY) {
  const box = selectedBox();
  const img = currentPage().img;
  const { left, top, right, bottom } = drag.anchor;

  // Mouse position in real image pixels, kept inside the photo
  const px = clamp(mouseX / state.scale, 0, img.naturalWidth);
  const py = clamp(mouseY / state.scale, 0, img.naturalHeight);

  // The handle name tells us which edges move: n = top, s = bottom, w = left, e = right
  let newLeft = left, newRight = right, newTop = top, newBottom = bottom;
  if (drag.handle.includes('w')) newLeft = Math.min(px, right - MIN_BOX_SIZE);
  if (drag.handle.includes('e')) newRight = Math.max(px, left + MIN_BOX_SIZE);
  if (drag.handle.includes('n')) newTop = Math.min(py, bottom - MIN_BOX_SIZE);
  if (drag.handle.includes('s')) newBottom = Math.max(py, top + MIN_BOX_SIZE);

  box.x = newLeft;
  box.y = newTop;
  box.w = newRight - newLeft;
  box.h = newBottom - newTop;
}

/** Listening on the whole window means releasing the mouse outside the canvas still ends the drag. */
function onMouseUp() {
  if (!drag || state.phase !== 'draw') return;

  if (drag.mode === 'new') {
    finishNewBox();
  }
  drag = null;
  redraw();
}

function finishNewBox() {
  const screenW = Math.abs(drag.curX - drag.startX);
  const screenH = Math.abs(drag.curY - drag.startY);

  // Barely moved: that was just a click on empty space, not an attempt to draw
  if (Math.max(screenW, screenH) < MIN_DRAG_PX) return;

  // Check the size in REAL image pixels, not screen pixels. When zoomed in, a box that
  // looks big on screen can cover only a few real pixels, and that crop comes out blank.
  const realW = screenW / state.scale;
  const realH = screenH / state.scale;
  if (realW < MIN_BOX_SIZE || realH < MIN_BOX_SIZE) {
    alert(
      `That box is too small (only ${Math.round(realW)}x${Math.round(realH)} real image pixels, ` +
      `minimum ${MIN_BOX_SIZE}). Draw a bigger box, or zoom out a little.`
    );
    return;
  }

  const boxes = currentPage().boxes;
  boxes.push({
    x: Math.min(drag.startX, drag.curX) / state.scale,
    y: Math.min(drag.startY, drag.curY) / state.scale,
    w: realW,
    h: realH,
    text: '',
  });
  selectBox(boxes.length - 1);
  renderPageList();
}


/* ---------- 11. Draw phase: sidebar and deleting ---------- */

function renderPageList() {
  dom.pageList.innerHTML = '';
  state.pages.forEach((page, index) => {
    const item = document.createElement('div');
    item.className = 'page-thumb' + (index === state.currentPageIdx ? ' active' : '');
    item.innerHTML =
      `<img src="${page.img.src}">` +
      `<span>${escapeHtml(page.pageId)}<br><small>${page.boxes.length} box(es)</small></span>`;
    item.onclick = () => {
      state.currentPageIdx = index;
      setupDrawCanvas();
      renderPageList();
    };
    dom.pageList.appendChild(item);
  });
}

function deleteSelectedBox() {
  if (state.selectedBoxIdx === -1) return;
  currentPage().boxes.splice(state.selectedBoxIdx, 1);
  selectBox(-1);
  renderPageList();
  redraw();
}

function onKeyDown(event) {
  if (state.phase !== 'draw') return;

  const typingInField = ['TEXTAREA', 'INPUT'].includes(event.target.tagName);
  if (typingInField) return;   // never steal Backspace while typing

  if ((event.key === 'Delete' || event.key === 'Backspace') && state.selectedBoxIdx !== -1) {
    event.preventDefault();
    deleteSelectedBox();
  }
}


/* ---------- 12. Label phase ---------- */

function buildLabelQueue() {
  state.labelQueue = [];
  state.pages.forEach((page, pageIdx) => {
    page.boxes.forEach((box, boxIdx) => state.labelQueue.push({ pageIdx, boxIdx }));
  });
}

function countLabeledBoxes() {
  return state.pages.reduce(
    (sum, page) => sum + page.boxes.filter(box => box.text.trim() !== '').length,
    0
  );
}

function renderLabelCard() {
  const total = state.labelQueue.length;
  const labeledCount = countLabeledBoxes();

  if (state.labelCursor >= total) {
    renderAllLabeledMessage(labeledCount, total);
    return;
  }

  const { pageIdx, boxIdx } = state.labelQueue[state.labelCursor];
  const page = state.pages[pageIdx];
  const box = page.boxes[boxIdx];
  const progressPercent = Math.round((state.labelCursor / total) * 100);

  dom.canvasPane.innerHTML = `
    <div class="label-card">
      <div class="label-meta">
        ${escapeHtml(page.pageId)} — box ${boxIdx + 1} &nbsp;•&nbsp; ${state.labelCursor + 1} of ${total}
      </div>
      <div class="label-image-wrap"><img src="${cropBox(page, box).toDataURL()}"></div>
      <textarea id="labelInput" dir="auto"
                placeholder="Type what this line says, then press Enter..."></textarea>
      <div class="label-row">
        <div>
          <button class="btn-plain" id="prevBtn">&larr; Prev</button>
          <button class="btn-plain" id="skipBtn">Skip &rarr;</button>
        </div>
        <span class="hint">${labeledCount} / ${total} labeled</span>
      </div>
      <div class="progress-track"><div class="progress-bar" style="width:${progressPercent}%"></div></div>
    </div>
  `;

  const input = document.getElementById('labelInput');
  input.value = box.text;
  input.focus();

  input.addEventListener('keydown', (event) => {
    if (event.isComposing) return;                       // don't submit while an IME is composing
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      box.text = input.value.trim();
      state.labelCursor++;
      renderLabelCard();
    }
  });

  document.getElementById('prevBtn').onclick = () => {
    box.text = input.value.trim();
    state.labelCursor = Math.max(0, state.labelCursor - 1);
    renderLabelCard();
  };
  document.getElementById('skipBtn').onclick = () => {
    state.labelCursor++;
    renderLabelCard();
  };
}

function renderAllLabeledMessage(labeledCount, total) {
  dom.canvasPane.innerHTML = `
    <div class="empty-state">
      <p><strong>All boxes labeled!</strong> (${labeledCount} / ${total})</p>
      <p class="hint">Click "Export ZIP" above to download your cropped line images + labels.csv.</p>
    </div>`;
}


/* ---------- 13. Export ---------- */

/** Wrap a value in quotes for CSV, doubling any quotes inside it. */
function csvCell(value) {
  return '"' + String(value).replace(/"/g, '""') + '"';
}

/** Make sure the JSZip library is available, loading it on demand if the page's copy failed. */
function ensureJSZip() {
  if (typeof JSZip !== 'undefined') return Promise.resolve(true);

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = JSZIP_URL;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

async function exportZip() {
  if (totalBoxCount() === 0) {
    alert('No boxes drawn yet.');
    return;
  }
  if (!(await ensureJSZip())) {
    alert('Export needs the JSZip library from the internet, but it could not be loaded. ' +
          'Check your connection and click Export again (your boxes are still here).');
    return;
  }

  const zip = new JSZip();
  let csv = 'filename,label\n';

  for (const page of state.pages) {
    page.boxes.forEach((box, index) => {
      const filename = `${page.pageId}_line${String(index + 1).padStart(2, '0')}.png`;
      const pngBase64 = cropBox(page, box).toDataURL('image/png').split(',')[1];

      zip.file(filename, pngBase64, { base64: true });
      csv += `${csvCell(filename)},${csvCell(box.text || '')}\n`;
    });
  }
  zip.file('labels.csv', csv);

  const blob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `myakkhara_labeled_${state.pages.length}pages.zip`;
  link.click();
}


/* ---------- 14. Start-up ---------- */

function init() {
  dom.loadBtn.onclick = () => dom.fileInput.click();
  dom.loadBtn2.onclick = () => dom.fileInput.click();
  dom.fileInput.addEventListener('change', onFilesChosen);

  dom.drawPhaseBtn.onclick = enterDrawPhase;
  dom.labelPhaseBtn.onclick = enterLabelPhase;

  dom.zoomInBtn.onclick = () => setZoom(state.scale * ZOOM.buttonStep);
  dom.zoomOutBtn.onclick = () => setZoom(state.scale / ZOOM.buttonStep);
  dom.deleteBoxBtn.onclick = deleteSelectedBox;
  dom.exportBtn.onclick = exportZip;

  window.addEventListener('mouseup', onMouseUp);
  document.addEventListener('keydown', onKeyDown);

  dom.headerSub.textContent = SUBTITLES.draw;
  updateToolbar();
}

init();
