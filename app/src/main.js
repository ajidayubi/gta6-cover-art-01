import { drawCover, computePanelRects } from './cover.js';
import { runShot } from './shots.js';

export function initApp() {
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
    if (captionTitle !== undefined && captionTitle !== null) {
      state.title = captionTitle;
    }
    if (captionSubtitle !== undefined && captionSubtitle !== null) {
      state.subtitle = captionSubtitle;
    }
    if (layoutChoice !== undefined && layoutChoice !== null) {
      state.layout = layoutChoice;
    }
    if (gradeChoice !== undefined && gradeChoice !== null) {
      state.grade = gradeChoice;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = `samples/${sampleName}.jpg`;

    img.onload = () => {
      let targetIndex = state.panels.findIndex(p => p.photo === null);
      if (targetIndex === -1) {
        targetIndex = state.selectedPanel >= 0 && state.selectedPanel < state.panels.length ? state.selectedPanel : 0;
      }
      state.panels[targetIndex].photo = img;
      state.photos.push(img);
      refreshControls();
      redraw();
    };
  }

  function redraw() {
    const canvas = document.getElementById('preview-canvas');
    if (!canvas) return;

    let w = 1920;
    let h = 1080;
    if (state.exportSize === '1080x1920') {
      w = 1080;
      h = 1920;
    } else if (state.exportSize === '1080x1080') {
      w = 1080;
      h = 1080;
    } else if (state.exportSize === '3840x2160') {
      w = 3840;
      h = 2160;
    }

    canvas.width = w;
    canvas.height = h;

    drawCover(canvas, state);

    if (state.selectedPanel >= 0 && state.selectedPanel < state.panels.length) {
      const rects = computePanelRects(state.layout, w, h);
      const rect = rects[state.selectedPanel];
      if (rect) {
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = Math.max(4, Math.round(w / 400));
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        ctx.restore();
      }
    }
  }

  function refreshControls() {
    const titleInput = document.getElementById('title-input');
    if (titleInput && document.activeElement !== titleInput) {
      titleInput.value = state.title;
    }

    const subtitleInput = document.getElementById('subtitle-input');
    if (subtitleInput && document.activeElement !== subtitleInput) {
      subtitleInput.value = state.subtitle;
    }

    const titleSizeSlider = document.getElementById('title-size-slider');
    if (titleSizeSlider && document.activeElement !== titleSizeSlider) {
      titleSizeSlider.value = state.titleSize;
    }

    const grainCheck = document.getElementById('grain-checkbox');
    if (grainCheck) {
      grainCheck.checked = state.grain;
    }

    const vignetteCheck = document.getElementById('vignette-checkbox');
    if (vignetteCheck) {
      vignetteCheck.checked = state.vignette;
    }

    const zoomSlider = document.getElementById('zoom-slider');
    if (zoomSlider && document.activeElement !== zoomSlider) {
      const currentPanel = state.panels[state.selectedPanel];
      if (currentPanel) {
        zoomSlider.value = currentPanel.zoom;
      }
    }

    document.querySelectorAll('.layout-btn').forEach(btn => {
      if (btn.dataset.layout === state.layout) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.grade-btn').forEach(btn => {
      if (btn.dataset.grade === state.grade) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.color-swatch').forEach(swatch => {
      if (swatch.dataset.color === state.titleColor) {
        swatch.classList.add('active');
      } else {
        swatch.classList.remove('active');
      }
    });

    document.querySelectorAll('.export-size-btn').forEach(btn => {
      if (btn.dataset.size === state.exportSize) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.panel-thumb').forEach((thumb, idx) => {
      if (idx === state.selectedPanel) {
        thumb.classList.add('selected');
      } else {
        thumb.classList.remove('selected');
      }
    });
  }

  function setupUI() {
    // Thumbnail container or samples
    const samplesContainer = document.getElementById('sample-thumbnails');
    if (samplesContainer) {
      samplesContainer.innerHTML = '';
      sampleNames.forEach((name, idx) => {
        const thumb = document.createElement('div');
        thumb.className = 'sample-thumb';
        thumb.style.backgroundImage = `url(samples/${name}.jpg)`;
        thumb.style.backgroundSize = 'cover';
        thumb.style.backgroundPosition = 'center';
        thumb.addEventListener('click', () => {
          photoLoader(name, null, null, null, null);
        });
        samplesContainer.appendChild(thumb);
      });
    }

    // Panels preview selector / thumbnails
    const panelsContainer = document.getElementById('panel-thumbnails');
    if (panelsContainer) {
      panelsContainer.innerHTML = '';
      state.panels.forEach((panel, idx) => {
        const thumb = document.createElement('div');
        thumb.className = 'panel-thumb';
        if (idx === state.selectedPanel) thumb.classList.add('selected');
        thumb.addEventListener('click', () => {
          state.selectedPanel = idx;
          refreshControls();
          redraw();
        });
        panelsContainer.appendChild(thumb);
      });
    }

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
      titleInput.addEventListener('input', e => {
        state.title = e.target.value;
        redraw();
      });
    }

    // Subtitle input
    const subtitleInput = document.getElementById('subtitle-input');
    if (subtitleInput) {
      subtitleInput.addEventListener('input', e => {
        state.subtitle = e.target.value;
        redraw();
      });
    }

    // Title size slider
    const titleSizeSlider = document.getElementById('title-size-slider');
    if (titleSizeSlider) {
      titleSizeSlider.addEventListener('input', e => {
        state.titleSize = parseFloat(e.target.value);
        redraw();
      });
    }

    // Title color swatches
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        state.titleColor = swatch.dataset.color;
        refreshControls();
        redraw();
      });
    });

    // Grain checkbox
    const grainCheck = document.getElementById('grain-checkbox');
    if (grainCheck) {
      grainCheck.addEventListener('change', e => {
        state.grain = e.target.checked;
        redraw();
      });
    }

    // Vignette checkbox
    const vignetteCheck = document.getElementById('vignette-checkbox');
    if (vignetteCheck) {
      vignetteCheck.addEventListener('change', e => {
        state.vignette = e.target.checked;
        redraw();
      });
    }

    // Zoom slider
    const zoomSlider = document.getElementById('zoom-slider');
    if (zoomSlider) {
      zoomSlider.addEventListener('input', e => {
        const p = state.panels[state.selectedPanel];
        if (p) {
          p.zoom = parseFloat(e.target.value);
          redraw();
        }
      });
    }

    // Fill button
    const fillBtn = document.getElementById('fill-btn');
    if (fillBtn) {
      fillBtn.addEventListener('click', () => {
        const p = state.panels[state.selectedPanel];
        if (p) {
          p.fit = 'cover';
          refreshControls();
          redraw();
        }
      });
    }

    // Fit button
    const fitBtn = document.getElementById('fit-btn');
    if (fitBtn) {
      fitBtn.addEventListener('click', () => {
        const p = state.panels[state.selectedPanel];
        if (p) {
          p.fit = 'contain';
          refreshControls();
          redraw();
        }
      });
    }

    // Export size buttons
    document.querySelectorAll('.export-size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.exportSize = btn.dataset.size;
        refreshControls();
        redraw();
      });
    });

    // Export PNG button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const previewCanvas = document.getElementById('preview-canvas');
        if (!previewCanvas) return;

        let w = 1920;
        let h = 1080;
        if (state.exportSize === '1080x1920') {
          w = 1080;
          h = 1920;
        } else if (state.exportSize === '1080x1080') {
          w = 1080;
          h = 1080;
        } else if (state.exportSize === '3840x2160') {
          w = 3840;
          h = 2160;
        }

        const offCanvas = document.createElement('canvas');
        offCanvas.width = w;
        offCanvas.height = h;

        drawCover(offCanvas, state);

        const link = document.createElement('a');
        link.download = 'gta6-cover.png';
        link.href = offCanvas.toDataURL('image/png');
        link.click();

        const statusMsg = document.getElementById('status-message');
        if (statusMsg) {
          statusMsg.textContent = 'Cover exported successfully!';
          statusMsg.style.display = 'block';
          setTimeout(() => {
            statusMsg.style.display = 'none';
          }, 3000);
        }
      });
    }
  }

  async function start() {
    setupUI();

    try {
      await document.fonts.load('16px Anton');
      await document.fonts.load('16px "Bebas Neue"');
    } catch (err) {
      console.warn('Font loading failed or timed out', err);
    }

    const params = new URLSearchParams(window.location.search);
    const queryObj = {
      get(key) {
        return params.get(key);
      },
      title: params.get('title'),
      subtitle: params.get('subtitle'),
      layout: params.get('layout'),
      grade: params.get('grade'),
      size: params.get('size')
    };

    if (queryObj.size) {
      const validSizes = ['1920x1080', '1080x1920', '1080x1080', '3840x2160'];
      if (validSizes.includes(queryObj.size)) {
        state.exportSize = queryObj.size;
      }
    }

    const shotName = params.get('shot');
    if (shotName) {
      await runShot(shotName, queryObj, (sName, cTitle, cSubtitle, lChoice, gChoice) => {
        photoLoader(sName, cTitle, cSubtitle, lChoice, gChoice);
      });
    } else {
      for (const name of sampleNames) {
        photoLoader(name, null, null, null, null);
      }
    }

    refreshControls();
    redraw();
  }

  start();
}

initApp();
