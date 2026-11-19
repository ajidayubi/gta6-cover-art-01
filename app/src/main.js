import { drawCover, computePanelRects } from './cover.js';
import { runShot } from './shots.js';

export async function main() {
  const state = {
    layout: 'Vice Trio',
    panels: [
      { photo: null, zoom: 1, panX: 0, panY: 0, fit: 'cover' },
      { photo: null, zoom: 1, panX: 0, panY: 0, fit: 'cover' },
      { photo: null, zoom: 1, panX: 0, panY: 0, fit: 'cover' },
      { photo: null, zoom: 1, panX: 0, panY: 0, fit: 'cover' }
    ],
    photos: [],
    grade: 'Sunset',
    title: 'SUNSET HEIST',
    subtitle: 'NEON SUNSET • 2026',
    titleSize: 1,
    titleColor: 'white',
    grain: true,
    vignette: true,
    exportSize: '1920x1080',
    selectedPanel: 0
  };

  const sampleNames = ['neon-street', 'pier-dusk', 'boulevard', 'skyline-night'];

  function photoLoader(sampleName, captionTitle, captionSubtitle, layoutChoice, gradeChoice) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = `./samples/${sampleName}.jpg`;
      img.onload = () => {
        let targetPanelIndex = state.panels.findIndex(p => !p.photo);
        if (targetPanelIndex === -1) {
          targetPanelIndex = 0;
        }
        state.panels[targetPanelIndex].photo = img;
        state.photos.push(img);

        if (captionTitle) state.title = captionTitle;
        if (captionSubtitle) state.subtitle = captionSubtitle;
        if (layoutChoice) state.layout = layoutChoice;
        if (gradeChoice) state.grade = gradeChoice;

        refreshControls();
        redraw();
        resolve(img);
      };
      img.onerror = () => {
        resolve(null);
      };
    });
  }

  const canvas = document.getElementById('preview-canvas');
  const statusEl = document.getElementById('status-message');

  function redraw() {
    if (!canvas) return;
    const [w, h] = state.exportSize.split('x').map(Number);
    if (w && h) {
      canvas.width = w;
      canvas.height = h;
    }

    drawCover(canvas, state);

    // Outline selected panel in pink
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const panelRects = computePanelRects(canvas.width, canvas.height, state.layout);
      if (panelRects && panelRects[state.selectedPanel]) {
        const rect = panelRects[state.selectedPanel];
        ctx.save();
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = Math.max(4, Math.round(canvas.width / 400));
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        ctx.restore();
      }
    }
  }

  function refreshControls() {
    // Layout buttons
    document.querySelectorAll('.layout-btn').forEach(btn => {
      if (btn.dataset.layout === state.layout) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Grade buttons
    document.querySelectorAll('.grade-btn').forEach(btn => {
      if (btn.dataset.grade === state.grade) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Title & subtitle inputs
    const titleInput = document.getElementById('title-input');
    if (titleInput && titleInput.value !== state.title) titleInput.value = state.title;

    const subtitleInput = document.getElementById('subtitle-input');
    if (subtitleInput && subtitleInput.value !== state.subtitle) subtitleInput.value = state.subtitle;

    // Title size slider
    const sizeSlider = document.getElementById('title-size-slider');
    if (sizeSlider) sizeSlider.value = state.titleSize;

    // Color swatches
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      if (swatch.dataset.color === state.titleColor) {
        swatch.classList.add('active');
      } else {
        swatch.classList.remove('active');
      }
    });

    // Grain & vignette checkboxes
    const grainCb = document.getElementById('grain-checkbox');
    if (grainCb) grainCb.checked = state.grain;

    const vignetteCb = document.getElementById('vignette-checkbox');
    if (vignetteCb) vignetteCb.checked = state.vignette;

    // Zoom slider & fit buttons for selected panel
    const zoomSlider = document.getElementById('zoom-slider');
    const panel = state.panels[state.selectedPanel];
    if (zoomSlider && panel) zoomSlider.value = panel.zoom;

    document.querySelectorAll('.fit-btn').forEach(btn => {
      if (panel && btn.dataset.fit === panel.fit) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Export size buttons
    document.querySelectorAll('.size-btn').forEach(btn => {
      if (btn.dataset.size === state.exportSize) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Panel selector indicator
    document.querySelectorAll('.panel-thumb').forEach((thumb, idx) => {
      if (idx === state.selectedPanel) {
        thumb.classList.add('selected');
      } else {
        thumb.classList.remove('selected');
      }
    });
  }

  function wireControls() {
    // Sample thumbnails
    document.querySelectorAll('.sample-thumb').forEach((thumb, idx) => {
      thumb.addEventListener('click', () => {
        const sName = sampleNames[idx];
        if (sName) {
          photoLoader(sName);
        }
      });
    });

    // Layout buttons
    document.querySelectorAll('.layout-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.layout = btn.dataset.layout;
        refreshControls();
        redraw();
      });
    });

    // Grade buttons
    document.querySelectorAll('.grade-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.grade = btn.dataset.grade;
        refreshControls();
        redraw();
      });
    });

    // Title input
    const titleInput = document.getElementById('title-input');
    if (titleInput) {
      titleInput.addEventListener('input', () => {
        state.title = titleInput.value;
        redraw();
      });
    }

    // Subtitle input
    const subtitleInput = document.getElementById('subtitle-input');
    if (subtitleInput) {
      subtitleInput.addEventListener('input', () => {
        state.subtitle = subtitleInput.value;
        redraw();
      });
    }

    // Title size slider
    const sizeSlider = document.getElementById('title-size-slider');
    if (sizeSlider) {
      sizeSlider.addEventListener('input', () => {
        state.titleSize = parseFloat(sizeSlider.value);
        redraw();
      });
    }

    // Color swatches
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        state.titleColor = swatch.dataset.color;
        refreshControls();
        redraw();
      });
    });

    // Grain checkbox
    const grainCb = document.getElementById('grain-checkbox');
    if (grainCb) {
      grainCb.addEventListener('change', () => {
        state.grain = grainCb.checked;
        redraw();
      });
    }

    // Vignette checkbox
    const vignetteCb = document.getElementById('vignette-checkbox');
    if (vignetteCb) {
      vignetteCb.addEventListener('change', () => {
        state.vignette = vignetteCb.checked;
        redraw();
      });
    }

    // Zoom slider
    const zoomSlider = document.getElementById('zoom-slider');
    if (zoomSlider) {
      zoomSlider.addEventListener('input', () => {
        const panel = state.panels[state.selectedPanel];
        if (panel) {
          panel.zoom = parseFloat(zoomSlider.value);
          redraw();
        }
      });
    }

    // Fit & Fill buttons
    document.querySelectorAll('.fit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const panel = state.panels[state.selectedPanel];
        if (panel) {
          panel.fit = btn.dataset.fit;
          refreshControls();
          redraw();
        }
      });
    });

    // Export size buttons
    document.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.exportSize = btn.dataset.size;
        refreshControls();
        redraw();
      });
    });

    // Panel selection thumbnails / tabs
    document.querySelectorAll('.panel-thumb').forEach((thumb, idx) => {
      thumb.addEventListener('click', () => {
        state.selectedPanel = idx;
        refreshControls();
        redraw();
      });
    });

    // Export PNG button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const offCanvas = document.createElement('canvas');
        const [w, h] = state.exportSize.split('x').map(Number);
        offCanvas.width = w || 1920;
        offCanvas.height = h || 1080;
        drawCover(offCanvas, state);

        const dataUrl = offCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${state.title.toLowerCase().replace(/\s+/g, '-')}-cover.png`;
        link.href = dataUrl;
        link.click();

        if (statusEl) {
          statusEl.textContent = 'Cover exported successfully as PNG!';
          setTimeout(() => {
            statusEl.textContent = '';
          }, 3000);
        }
      });
    }
  }

  // Build sample thumbnails DOM if container exists
  const sampleContainer = document.getElementById('sample-thumbnails');
  if (sampleContainer && sampleContainer.children.length === 0) {
    sampleNames.forEach((sName, idx) => {
      const thumb = document.createElement('div');
      thumb.className = 'sample-thumb';
      thumb.dataset.index = idx;
      const img = document.createElement('img');
      img.src = `./samples/${sName}.jpg`;
      thumb.appendChild(img);
      sampleContainer.appendChild(thumb);
    });
  }

  // Wire controls
  wireControls();

  // Await loading fonts Anton and Bebas Neue
  try {
    await document.fonts.load('16px Anton');
    await document.fonts.load('16px "Bebas Neue"');
  } catch (e) {
    // Fonts might already be loaded or fallback will apply
  }

  // Parse query string into an object with get method and direct named properties
  const urlParams = new URLSearchParams(window.location.search);
  const queryObj = {
    title: urlParams.get('title'),
    subtitle: urlParams.get('subtitle'),
    layout: urlParams.get('layout'),
    grade: urlParams.get('grade'),
    size: urlParams.get('size'),
    get(name) {
      return urlParams.get(name);
    }
  };

  const knownSizes = ['1920x1080', '1080x1920', '1080x1080', '1280x720'];
  if (queryObj.size && knownSizes.includes(queryObj.size)) {
    state.exportSize = queryObj.size;
  }

  const shotParam = urlParams.get('shot');
  if (shotParam) {
    await runShot(shotParam, queryObj, (sName, cTitle, cSubtitle, lChoice, gChoice) => {
      return photoLoader(sName, cTitle, cSubtitle, lChoice, gChoice);
    });
  } else {
    for (const sName of sampleNames) {
      await photoLoader(sName);
    }
  }

  refreshControls();
  redraw();
}

main();
