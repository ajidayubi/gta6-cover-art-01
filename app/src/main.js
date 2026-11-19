import { computePanelRects, drawCover } from './cover.js';
import { runShot } from './shots.js';

// State object with default values per spec
const state = {
  layout: 'Vice Trio',
  grade: 'Sunset',
  title: 'SUNSET HEIST',
  subtitle: 'NEON SUNSET • 2026',
  titleSize: 1.0,
  titleColor: '#ffffff',
  grain: true,
  vignette: true,
  exportSize: '1920x1080',
  panels: [
    { photo: null, zoom: 1, panX: 0, panY: 0, fit: 'cover' },
    { photo: null, zoom: 1, panX: 0, panY: 0, fit: 'cover' },
    { photo: null, zoom: 1, panX: 0, panY: 0, fit: 'cover' },
    { photo: null, zoom: 1, panX: 0, panY: 0, fit: 'cover' }
  ],
  selectedPanel: 0,
  photos: []
};

// Dimensions map for export sizes
const sizeDimensions = {
  '1080x1080': { width: 1080, height: 1080 },
  '1080x1350': { width: 1080, height: 1350 },
  '1920x1080': { width: 1920, height: 1080 }
};

// DOM Elements
const canvas = document.getElementById('preview');
const thumbsContainer = document.getElementById('thumbs');
const uploadInput = document.getElementById('upload');
const layoutButtons = document.querySelectorAll('#layouts button');
const gradeButtons = document.querySelectorAll('#grades button');
const grainCheckbox = document.getElementById('grain');
const vignetteCheckbox = document.getElementById('vignette');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const titleSizeSlider = document.getElementById('titleSize');
const swatchButtons = document.querySelectorAll('#swatches button');
const sizeButtons = document.querySelectorAll('#sizes button');
const exportBtn = document.getElementById('exportBtn');
const statusLine = document.getElementById('status');
const panelNameEl = document.getElementById('panelName');
const zoomSlider = document.getElementById('zoom');
const fillBtn = document.getElementById('fillBtn');
const fitBtn = document.getElementById('fitBtn');

// Helper to get image dimensions
function getImageDimensions(img) {
  return new Promise((resolve) => {
    if (img.complete && img.naturalWidth) {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    } else {
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: 1000, height: 1000 });
    }
  });
}

// Load a sample image or photo into panels in order
async function loadPhoto(sampleNameOrUrl, captionTitle, captionSubtitle, layoutChoice, gradeChoice) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    // If it's a sample name (e.g. 'neon-street'), construct local path, else object URL
    if (sampleNameOrUrl.startsWith('blob:') || sampleNameOrUrl.startsWith('data:') || sampleNameOrUrl.includes('/')) {
      img.src = sampleNameOrUrl;
    } else {
      img.src = `./samples/${sampleNameOrUrl}.jpg`;
    }

    img.onload = () => {
      state.photos.push(img);

      // Assign to panels in order (find first panel without photo, or first panel when every panel already has one)
      let assigned = false;
      for (let i = 0; i < state.panels.length; i++) {
        if (!state.panels[i].photo) {
          state.panels[i].photo = img;
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        state.panels[0].photo = img;
      }

      if (captionTitle) state.title = captionTitle;
      if (captionSubtitle) state.subtitle = captionSubtitle;
      if (layoutChoice) state.layout = layoutChoice;
      if (gradeChoice) state.grade = gradeChoice;

      renderThumbnails();
      redraw();
      resolve(img);
    };

    img.onerror = () => {
      resolve(null);
    };
  });
}

// Render thumbnails in the Photos section
function renderThumbnails() {
  if (!thumbsContainer) return;
  thumbsContainer.innerHTML = '';

  // Render sample/uploaded photo tray
  state.photos.forEach((photo, idx) => {
    const thumb = document.createElement('div');
    thumb.className = 'sample-thumb';
    const thumbImg = document.createElement('img');
    thumbImg.src = photo.src;
    thumb.appendChild(thumbImg);
    thumb.addEventListener('click', () => {
      // Clicking photo in tray loads into currently selected panel
      state.panels[state.selectedPanel].photo = photo;
      state.panels[state.selectedPanel].zoom = 1;
      state.panels[state.selectedPanel].panX = 0;
      state.panels[state.selectedPanel].panY = 0;
      redraw();
    });
    thumbsContainer.appendChild(thumb);
  });
}

// Redraw preview canvas
function redraw() {
  if (!canvas) return;
  const dim = sizeDimensions[state.exportSize] || sizeDimensions['1920x1080'];
  canvas.width = dim.width;
  canvas.height = dim.height;

  // Draw cover
  drawCover(canvas, state);

  // Highlight selected panel with pink outline
  const ctx = canvas.getContext('2d');
  const rects = computePanelRects(state.layout, dim.width, dim.height);
  if (rects[state.selectedPanel]) {
    const r = rects[state.selectedPanel];
    ctx.save();
    ctx.strokeStyle = '#ff2a8d';
    ctx.lineWidth = Math.max(3, dim.width * 0.003);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.restore();
  }
}

// Update control UI values from state
function updateControlsUI() {
  if (panelNameEl) {
    panelNameEl.textContent = `Panel ${state.selectedPanel + 1} selected`;
  }
  const currentPanel = state.panels[state.selectedPanel];
  if (currentPanel && zoomSlider) {
    zoomSlider.value = currentPanel.zoom;
    if (currentPanel.fit === 'cover') {
      fillBtn?.classList.add('active');
      fitBtn?.classList.remove('active');
    } else {
      fitBtn?.classList.add('active');
      fillBtn?.classList.remove('active');
    }
  }

  layoutButtons.forEach(btn => {
    if (btn.getAttribute('data-layout') === state.layout) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  gradeButtons.forEach(btn => {
    if (btn.getAttribute('data-grade') === state.grade) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  if (grainCheckbox) grainCheckbox.checked = state.grain;
  if (vignetteCheckbox) vignetteCheckbox.checked = state.vignette;
  if (titleInput) titleInput.value = state.title;
  if (subtitleInput) subtitleInput.value = state.subtitle;
  if (titleSizeSlider) titleSizeSlider.value = state.titleSize;

  swatchButtons.forEach(btn => {
    if (btn.getAttribute('data-color') === state.titleColor) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  sizeButtons.forEach(btn => {
    if (btn.getAttribute('data-size') === state.exportSize) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Wire up all UI event listeners once at startup
function setupEventListeners() {
  // Layout buttons
  layoutButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      state.layout = btn.getAttribute('data-layout');
      updateControlsUI();
      redraw();
    });
  });

  // Grade buttons
  gradeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      state.grade = btn.getAttribute('data-grade');
      updateControlsUI();
      redraw();
    });
  });

  // Grain / Vignette
  grainCheckbox?.addEventListener('change', () => {
    state.grain = grainCheckbox.checked;
    redraw();
  });
  vignetteCheckbox?.addEventListener('change', () => {
    state.vignette = vignetteCheckbox.checked;
    redraw();
  });

  // Caption inputs
  titleInput?.addEventListener('input', () => {
    state.title = titleInput.value;
    redraw();
  });
  subtitleInput?.addEventListener('input', () => {
    state.subtitle = subtitleInput.value;
    redraw();
  });
  titleSizeSlider?.addEventListener('input', () => {
    state.titleSize = parseFloat(titleSizeSlider.value);
    redraw();
  });

  // Swatches
  swatchButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      state.titleColor = btn.getAttribute('data-color');
      updateControlsUI();
      redraw();
    });
  });

  // Export size buttons
  sizeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      state.exportSize = btn.getAttribute('data-size');
      updateControlsUI();
      redraw();
    });
  });

  // Panel controls (Zoom & Fit/Fill)
  zoomSlider?.addEventListener('input', () => {
    state.panels[state.selectedPanel].zoom = parseFloat(zoomSlider.value);
    redraw();
  });

  fillBtn?.addEventListener('click', () => {
    state.panels[state.selectedPanel].fit = 'cover';
    updateControlsUI();
    redraw();
  });

  fitBtn?.addEventListener('click', () => {
    state.panels[state.selectedPanel].fit = 'contain';
    updateControlsUI();
    redraw();
  });

  // Upload input
  uploadInput?.addEventListener('change', (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      loadPhoto(url);
    });
    uploadInput.value = '';
  });

  // Canvas click to select panel
  canvas?.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Map click from display size to export canvas size
    const dim = sizeDimensions[state.exportSize] || sizeDimensions['1920x1080'];
    const scaleX = dim.width / rect.width;
    const scaleY = dim.height / rect.height;
    const exportX = clickX * scaleX;
    const exportY = clickY * scaleY;

    const panelRects = computePanelRects(state.layout, dim.width, dim.height);
    for (let i = 0; i < panelRects.length; i++) {
      const pr = panelRects[i];
      if (exportX >= pr.x && exportX <= pr.x + pr.w && exportY >= pr.y && exportY <= pr.y + pr.h) {
        state.selectedPanel = i;
        updateControlsUI();
        redraw();
        break;
      }
    }
  });

  // Canvas drag to pan selected panel photo
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  canvas?.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    startX = e.clientX;
    startY = e.clientY;

    const rect = canvas.getBoundingClientRect();
    const dim = sizeDimensions[state.exportSize] || sizeDimensions['1920x1080'];
    const scaleX = dim.width / rect.width;
    const scaleY = dim.height / rect.height;

    const panel = state.panels[state.selectedPanel];
    if (panel) {
      panel.panX += dx * scaleX * 0.5;
      panel.panY += dy * scaleY * 0.5;
      redraw();
    }
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Export button
  exportBtn?.addEventListener('click', () => {
    const dim = sizeDimensions[state.exportSize] || sizeDimensions['1920x1080'];
    const offCanvas = document.createElement('canvas');
    offCanvas.width = dim.width;
    offCanvas.height = dim.height;

    // Render cover on offscreen canvas
    drawCover(offCanvas, state);

    const fileName = `vice-cover-${state.exportSize}.png`;
    offCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (statusLine) {
        statusLine.textContent = `Saved ${fileName}`;
      }
    }, 'image/png');
  });
}

// Main entry point
async function init() {
  // 1. Wire up all controls and event listeners first (required for shot mode or editor)
  setupEventListeners();

  // 2. Load fonts before first draw
  try {
    await document.fonts.load("400 16px 'Anton'");
    await document.fonts.load("400 16px 'Bebas Neue'");
  } catch (err) {
    console.warn('Font load warning:', err);
  }

  // 3. Build URL query object with get method
  const urlParams = new URLSearchParams(window.location.search);
  const queryObj = {
    get: (key) => urlParams.get(key),
    title: urlParams.get('title'),
    subtitle: urlParams.get('subtitle'),
    layout: urlParams.get('layout'),
    grade: urlParams.get('grade'),
    size: urlParams.get('size')
  };

  const shotParam = urlParams.get('shot');

  // Loader function for shots or startup: takes sample name and caption title (plus optional args)
  const loaderFunc = async (sampleName, captionTitle, captionSubtitle, layoutChoice, gradeChoice) => {
    await loadPhoto(sampleName, captionTitle, captionSubtitle, layoutChoice, gradeChoice);
  };

  // If size parameter specified in query, apply it
  const sizeParam = urlParams.get('size');
  if (sizeParam && sizeDimensions[sizeParam]) {
    state.exportSize = sizeParam;
  }

  // 4. Handle screenshot branch or default editor startup
  if (shotParam) {
    // Screenshot mode: run shot runner
    await runShot(shotParam, queryObj, loaderFunc);
  } else {
    // Default editor startup: load four sample photos in order
    const samples = ['neon-street', 'pier-dusk', 'boulevard', 'skyline-night'];
    for (const s of samples) {
      await loadPhoto(s);
    }
  }

  updateControlsUI();
  redraw();
}

init();
