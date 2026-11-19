import { drawCover, computePanelRects } from './cover.js';
import { runShot } from './shots.js';

export async function init() {
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
      img.crossOrigin = 'anonymous';
      img.src = `samples/${sampleName}.jpg`;
      img.onload = () => {
        let targetPanel = state.panels.find(p => !p.photo);
        if (!targetPanel) {
          targetPanel = state.panels[state.selectedPanel] || state.panels[0];
        }
        targetPanel.photo = img;
        state.photos.push(img);

        if (captionTitle !== undefined && captionTitle !== null) state.title = captionTitle;
        if (captionSubtitle !== undefined && captionSubtitle !== null) state.subtitle = captionSubtitle;
        if (layoutChoice !== undefined && layoutChoice !== null) state.layout = layoutChoice;
        if (gradeChoice !== undefined && gradeChoice !== null) state.grade = gradeChoice;

        refreshControls();
        redraw();
        resolve(img);
      };
      img.onerror = () => {
        resolve(null);
      };
    });
  }

  const canvas = document.getElementById('preview-canvas') || document.querySelector('canvas');
  const statusEl = document.getElementById('status-message') || document.createElement('div');

  function showStatus(msg) {
    if (!statusEl.parentNode) {
      statusEl.id = 'status-message';
      statusEl.style.position = 'fixed';
      statusEl.style.bottom = '20px';
      statusEl.style.right = '20px';
      statusEl.style.background = 'rgba(0,0,0,0.8)';
      statusEl.style.color = '#fff';
      statusEl.style.padding = '10px 20px';
      statusEl.style.borderRadius = '4px';
      statusEl.style.zIndex = '9999';
      document.body.appendChild(statusEl);
    }
    statusEl.textContent = msg;
    statusEl.style.display = 'block';
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }

  function redraw() {
    if (!canvas) return;
    const [w, h] = state.exportSize.split('x').map(Number);
    canvas.width = w || 1920;
    canvas.height = h || 1080;

    drawCover(canvas, state);

    if (canvas === document.getElementById('preview-canvas') || canvas === document.querySelector('canvas')) {
      const ctx = canvas.getContext('2d');
      ctx.save();
      const rects = computePanelRects(state.layout, canvas.width, canvas.height);
      const selRect = rects[state.selectedPanel];
      if (selRect) {
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = Math.max(4, Math.round(canvas.width / 300));
        ctx.strokeRect(selRect.x, selRect.y, selRect.width, selRect.height);
      }
      ctx.restore();
    }
  }

  function refreshControls() {
    const titleInput = document.getElementById('title-input');
    if (titleInput && document.activeElement !== titleInput) titleInput.value = state.title;

    const subtitleInput = document.getElementById('subtitle-input');
    if (subtitleInput && document.activeElement !== subtitleInput) subtitleInput.value = state.subtitle;

    const sizeSlider = document.getElementById('title-size-slider');
    if (sizeSlider) sizeSlider.value = state.titleSize;

    const grainCheck = document.getElementById('grain-checkbox');
    if (grainCheck) grainCheck.checked = state.grain;

    const vigCheck = document.getElementById('vignette-checkbox');
    if (vigCheck) vigCheck.checked = state.vignette;

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

    document.querySelectorAll('.color-swatch').forEach(btn => {
      if (btn.dataset.color === state.titleColor) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.export-size-btn').forEach(btn => {
      if (btn.dataset.size === state.exportSize) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.sample-thumb').forEach(thumb => {
      if (thumb.dataset.sample === sampleNames[state.selectedPanel]) {
        thumb.classList.add('active');
      } else {
        thumb.classList.remove('active');
      }
    });
  }

  // Build sample thumbnails
  const thumbsContainer = document.getElementById('sample-thumbs') || document.querySelector('.sample-thumbnails');
  if (thumbsContainer) {
    thumbsContainer.innerHTML = '';
    sampleNames.forEach(name => {
      const thumb = document.createElement('div');
      thumb.className = 'sample-thumb';
      thumb.dataset.sample = name;
      thumb.style.backgroundImage = `url(samples/${name}.jpg)`;
      thumb.style.backgroundSize = 'cover';
      thumb.style.backgroundPosition = 'center';
      thumb.title = `Load ${name} into selected panel`;
      thumb.addEventListener('click', () => {
        photoLoader(name);
      });
      thumbsContainer.appendChild(thumb);
    });
  }

  // Wire control listeners
  const titleInput = document.getElementById('title-input');
  if (titleInput) {
    titleInput.addEventListener('input', e => {
      state.title = e.target.value;
      redraw();
    });
  }

  const subtitleInput = document.getElementById('subtitle-input');
  if (subtitleInput) {
    subtitleInput.addEventListener('input', e => {
      state.subtitle = e.target.value;
      redraw();
    });
  }

  const titleSizeSlider = document.getElementById('title-size-slider');
  if (titleSizeSlider) {
    titleSizeSlider.addEventListener('input', e => {
      state.titleSize = parseFloat(e.target.value);
      redraw();
    });
  }

  const grainCheckbox = document.getElementById('grain-checkbox');
  if (grainCheckbox) {
    grainCheckbox.addEventListener('change', e => {
      state.grain = e.target.checked;
      redraw();
    });
  }

  const vignetteCheckbox = document.getElementById('vignette-checkbox');
  if (vignetteCheckbox) {
    vignetteCheckbox.addEventListener('change', e => {
      state.vignette = e.target.checked;
      redraw();
    });
  }

  document.querySelectorAll('.layout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.layout = btn.dataset.layout;
      refreshControls();
      redraw();
    });
  });

  document.querySelectorAll('.grade-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.grade = btn.dataset.grade;
      refreshControls();
      redraw();
    });
  });

  document.querySelectorAll('.color-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      state.titleColor = btn.dataset.color;
      refreshControls();
      redraw();
    });
  });

  document.querySelectorAll('.export-size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.exportSize = btn.dataset.size;
      refreshControls();
      redraw();
    });
  });

  const zoomSlider = document.getElementById('zoom-slider');
  if (zoomSlider) {
    zoomSlider.addEventListener('input', e => {
      state.panels[state.selectedPanel].zoom = parseFloat(e.target.value);
      redraw();
    });
  }

  const fillBtn = document.getElementById('fill-btn') || document.querySelector('.fit-fill-btn');
  if (fillBtn) {
    fillBtn.addEventListener('click', () => {
      state.panels[state.selectedPanel].fit = 'cover';
      redraw();
    });
  }

  const fitBtn = document.getElementById('fit-btn') || document.querySelector('.fit-contain-btn');
  if (fitBtn) {
    fitBtn.addEventListener('click', () => {
      state.panels[state.selectedPanel].fit = 'contain';
      redraw();
    });
  }

  const exportPngBtn = document.getElementById('export-png-btn') || document.querySelector('.export-btn');
  if (exportPngBtn) {
    exportPngBtn.addEventListener('click', () => {
      const [w, h] = state.exportSize.split('x').map(Number);
      const offCanvas = document.createElement('canvas');
      offCanvas.width = w || 1920;
      offCanvas.height = h || 1080;
      drawCover(offCanvas, state);
      const link = document.createElement('a');
      link.download = 'gta6-cover.png';
      link.href = offCanvas.toDataURL('image/png');
      link.click();
      showStatus('Cover exported successfully as PNG!');
    });
  }

  // Panel selection clicks on preview canvas
  if (canvas) {
    canvas.addEventListener('click', e => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      const rects = computePanelRects(state.layout, canvas.width, canvas.height);
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        if (clickX >= r.x && clickX <= r.x + r.width && clickY >= r.y && clickY <= r.y + r.height) {
          state.selectedPanel = i;
          if (zoomSlider) zoomSlider.value = state.panels[state.selectedPanel].zoom;
          refreshControls();
          redraw();
          break;
        }
      }
    });
  }

  // Query string parsing
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
    state.exportSize = queryObj.size;
  }

  // Await fonts Anton and Bebas Neue
  if (document.fonts && document.fonts.load) {
    await Promise.all([
      document.fonts.load('1em Anton'),
      document.fonts.load('1em Bebas Neue')
    ]).catch(() => {});
  }

  const shotParam = queryObj.get('shot');
  if (shotParam) {
    await runShot(shotParam, queryObj, (sName, cTitle, cSubtitle, lChoice, gChoice) => {
      return photoLoader(sName, cTitle, cSubtitle, lChoice, gChoice);
    });
  } else {
    await Promise.all(sampleNames.map(name => photoLoader(name)));
  }

  refreshControls();
  redraw();
}

init();
