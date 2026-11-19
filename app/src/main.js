import { drawCover, layoutRects } from "./cover.js";
import { runShot } from "./shots.js";

const SAMPLES = ["neon-street", "pier-dusk", "boulevard", "skyline-night"];
const SIZES = {
  "1080x1080": [1080, 1080],
  "1080x1350": [1080, 1350],
  "1920x1080": [1920, 1080],
};

const state = {
  layout: "Vice Trio",
  grade: "Sunset",
  title: "SUNSET HEIST",
  subtitle: "NEON SUNSET • 2026",
  titleSize: 1.0,
  titleColor: "#ffffff",
  grain: true,
  vignette: true,
  exportSize: "1920x1080",
  photos: [],
  panels: [
    { zoom: 1, panX: 0, panY: 0, fit: "cover" },
    { zoom: 1, panX: 0, panY: 0, fit: "cover" },
    { zoom: 1, panX: 0, panY: 0, fit: "cover" },
    { zoom: 1, panX: 0, panY: 0, fit: "cover" },
  ],
  selected: 0,
};

const canvas = document.getElementById("preview");
const panelName = document.getElementById("panelName");
const statusEl = document.getElementById("status");

function currentRects() {
  return layoutRects(state.layout, canvas.width, canvas.height);
}

function redraw() {
  drawCover(canvas, state);
  const rects = currentRects();
  if (rects[state.selected]) {
    const ctx = canvas.getContext("2d");
    const r = rects[state.selected];
    ctx.save();
    ctx.strokeStyle = "#ff4fa3";
    ctx.lineWidth = Math.max(3, canvas.width * 0.003);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.restore();
  }
  if (panelName) {
    panelName.textContent = `Panel ${state.selected + 1} selected`;
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadSample(name, captionText) {
  const img = await loadImage(`./samples/${name}.jpg`);
  state.photos.push(img);
  if (captionText) state.title = captionText;
  return img;
}

async function loadSamples() {
  for (const name of SAMPLES) {
    try {
      const img = await loadImage(`./samples/${name}.jpg`);
      state.photos.push(img);
    } catch {
      // sample missing; panel stays empty and draws a placeholder
    }
  }
}

function setExportSize(size) {
  state.exportSize = size;
  const [w, h] = SIZES[size] || SIZES["1920x1080"];
  canvas.width = w;
  canvas.height = h;
  redraw();
}

function wire() {
  const thumbs = document.getElementById("thumbs");
  for (const name of SAMPLES) {
    const img = document.createElement("img");
    img.src = `./samples/${name}.jpg`;
    img.alt = name;
    img.addEventListener("click", async () => {
      const photo = await loadImage(`./samples/${name}.jpg`);
      state.photos[state.selected] = photo;
      redraw();
    });
    thumbs.appendChild(img);
  }
  const upload = document.getElementById("upload");
  upload.addEventListener("change", async () => {
    for (const file of upload.files) {
      if (state.photos.length >= 6) break;
      const url = URL.createObjectURL(file);
      const img = await loadImage(url);
      state.photos.push(img);
    }
    redraw();
  });
  document.getElementById("layouts").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-layout]");
    if (!btn) return;
    state.layout = btn.dataset.layout;
    document.querySelectorAll("#layouts button").forEach((b) => b.classList.toggle("active", b === btn));
    state.selected = 0;
    redraw();
  });
  document.getElementById("grades").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-grade]");
    if (!btn) return;
    state.grade = btn.dataset.grade;
    document.querySelectorAll("#grades button").forEach((b) => b.classList.toggle("active", b === btn));
    redraw();
  });
  document.getElementById("grain").addEventListener("change", (e) => {
    state.grain = e.target.checked;
    redraw();
  });
  document.getElementById("vignette").addEventListener("change", (e) => {
    state.vignette = e.target.checked;
    redraw();
  });
  document.getElementById("title").addEventListener("input", (e) => {
    state.title = e.target.value;
    redraw();
  });
  document.getElementById("subtitle").addEventListener("input", (e) => {
    state.subtitle = e.target.value;
    redraw();
  });
  document.getElementById("titleSize").addEventListener("input", (e) => {
    state.titleSize = parseFloat(e.target.value);
    redraw();
  });
  document.getElementById("swatches").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-color]");
    if (!btn) return;
    state.titleColor = btn.dataset.color;
    document.querySelectorAll("#swatches button").forEach((b) => b.classList.toggle("active", b === btn));
    redraw();
  });
  document.getElementById("sizes").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-size]");
    if (!btn) return;
    document.querySelectorAll("#sizes button").forEach((b) => b.classList.toggle("active", b === btn));
    setExportSize(btn.dataset.size);
  });
  document.getElementById("zoom").addEventListener("input", (e) => {
    state.panels[state.selected].zoom = parseFloat(e.target.value);
    redraw();
  });
  document.getElementById("fillBtn").addEventListener("click", () => {
    state.panels[state.selected].fit = "cover";
    document.getElementById("fillBtn").classList.add("active");
    document.getElementById("fitBtn").classList.remove("active");
    redraw();
  });
  document.getElementById("fitBtn").addEventListener("click", () => {
    state.panels[state.selected].fit = "fit";
    document.getElementById("fitBtn").classList.add("active");
    document.getElementById("fillBtn").classList.remove("active");
    redraw();
  });
  document.getElementById("exportBtn").addEventListener("click", () => {
    const [w, h] = SIZES[state.exportSize] || SIZES["1920x1080"];
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    drawCover(off, state);
    const a = document.createElement("a");
    a.href = off.toDataURL("image/png");
    a.download = `vice-cover-${state.exportSize}.png`;
    a.click();
    if (statusEl) statusEl.textContent = `Saved vice-cover-${state.exportSize}.png`;
  });
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const sy = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const rects = currentRects();
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (sx >= r.x && sx <= r.x + r.w && sy >= r.y && sy <= r.y + r.h) {
        state.selected = i;
        break;
      }
    }
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    redraw();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    state.panels[state.selected].panX += (e.clientX - lastX) * scale;
    state.panels[state.selected].panY += (e.clientY - lastY) * scale;
    lastX = e.clientX;
    lastY = e.clientY;
    redraw();
  });
  window.addEventListener("pointerup", () => {
    dragging = false;
  });
}

async function start() {
  try {
    await document.fonts.load('16px Anton');
    await document.fonts.load('16px "Bebas Neue"');
  } catch {
    // fonts fall back to sans-serif; drawing still works
  }
  const query = new URLSearchParams(location.search);
  const shot = query.get("shot");
  setExportSize(query.get("size") || state.exportSize);
  wire();
  if (shot) {
    state.layout = query.get("layout") || state.layout;
    state.grade = query.get("grade") || state.grade;
    state.title = query.get("title") || state.title;
    state.subtitle = query.get("subtitle") || state.subtitle;
    await runShot(shot, query, loadSample);
    redraw();
    return;
  }
  await loadSamples();
  redraw();
}

start();
