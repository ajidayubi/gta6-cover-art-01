export function layoutRects(layout, w, h) {
  const b = 10;
  const g = 8;
  const iw = w - b * 2;
  const ih = h - b * 2;
  if (layout === "Four Corners") {
    const pw = (iw - g) / 2;
    const ph = (ih - g) / 2;
    return [
      { x: b, y: b, w: pw, h: ph },
      { x: b + pw + g, y: b, w: pw, h: ph },
      { x: b, y: b + ph + g, w: pw, h: ph },
      { x: b + pw + g, y: b + ph + g, w: pw, h: ph },
    ];
  }
  if (layout === "Hero Strip") {
    const topH = ih * 0.68;
    const botH = ih - topH - g;
    const pw = (iw - g) / 2;
    return [
      { x: b, y: b, w: iw, h: topH },
      { x: b, y: b + topH + g, w: pw, h: botH },
      { x: b + pw + g, y: b + topH + g, w: pw, h: botH },
    ];
  }
  if (layout === "Single") {
    return [{ x: b, y: b, w: iw, h: ih }];
  }
  const heroW = iw * 0.58;
  const rightW = iw - heroW - g;
  const topH = ih * 0.55;
  const botH = ih - topH - g;
  return [
    { x: b, y: b, w: heroW, h: ih },
    { x: b + heroW + g, y: b, w: rightW, h: topH },
    { x: b + heroW + g, y: b + topH + g, w: rightW, h: botH },
  ];
}

function seededNoise() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d");
  const img = g.createImageData(128, 128);
  let seed = 1234567;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const v = seed % 256;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

let noiseCanvas = null;

function drawPhoto(ctx, img, rect, panel) {
  if (!img) return;
  const zoom = panel.zoom || 1;
  const panX = panel.panX || 0;
  const panY = panel.panY || 0;
  if (panel.fit === "fit") {
    const s = Math.min(rect.w / img.width, rect.h / img.height) * zoom;
    const dw = img.width * s;
    const dh = img.height * s;
    ctx.drawImage(img, rect.x + (rect.w - dw) / 2 + panX, rect.y + (rect.h - dh) / 2 + panY, dw, dh);
    return;
  }
  const s = Math.max(rect.w / img.width, rect.h / img.height) * zoom;
  const dw = img.width * s;
  const dh = img.height * s;
  const dx = rect.x + (rect.w - dw) / 2 + panX;
  const dy = rect.y + (rect.h - dh) / 2 + panY;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawGrade(ctx, rect, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (grade === "Sunset") {
    const gr = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    gr.addColorStop(0, "rgba(255,110,60,0)");
    gr.addColorStop(0.55, "rgba(255,110,60,0.28)");
    gr.addColorStop(1, "rgba(200,40,120,0.35)");
    ctx.fillStyle = gr;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = "rgba(80,20,120,0.18)";
    ctx.globalCompositeOperation = "multiply";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalCompositeOperation = "source-over";
  } else if (grade === "Neon") {
    const gr = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    gr.addColorStop(0, "rgba(0,229,255,0.22)");
    gr.addColorStop(1, "rgba(255,47,146,0.30)");
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = gr;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalCompositeOperation = "source-over";
  } else if (grade === "Vice") {
    const gr = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    gr.addColorStop(0, "rgba(120,60,220,0.25)");
    gr.addColorStop(1, "rgba(0,200,180,0.20)");
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle = gr;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalCompositeOperation = "source-over";
    const glow = ctx.createLinearGradient(0, rect.y + rect.h * 0.6, 0, rect.y + rect.h);
    glow.addColorStop(0, "rgba(255,47,146,0)");
    glow.addColorStop(1, "rgba(255,47,146,0.25)");
    ctx.fillStyle = glow;
    ctx.fillRect(rect.x, rect.y + rect.h * 0.6, rect.w, rect.h * 0.4);
  } else if (grade === "Noir") {
    ctx.fillStyle = "rgba(20,20,20,0.25)";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    const hi = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h * 0.4);
    hi.addColorStop(0, "rgba(255,190,120,0.12)");
    hi.addColorStop(1, "rgba(255,190,120,0)");
    ctx.fillStyle = hi;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h * 0.4);
  }
  ctx.restore();
}

function drawPlaceholder(ctx, rect) {
  const gr = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  gr.addColorStop(0, "rgba(255,170,60,1)");
  gr.addColorStop(0.6, "rgba(255,90,120,1)");
  gr.addColorStop(1, "rgba(120,40,160,1)");
  ctx.fillStyle = gr;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = "rgba(30,10,40,0.85)";
  ctx.lineWidth = Math.max(4, rect.w * 0.02);
  ctx.lineCap = "round";
  const bx = rect.x + rect.w * 0.3;
  const by = rect.y + rect.h;
  const tx = rect.x + rect.w * 0.45;
  const ty = rect.y + rect.h * 0.25;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.quadraticCurveTo(bx + rect.w * 0.05, rect.y + rect.h * 0.6, tx, ty);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const a = -0.4 - i * 0.5;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(
      tx + Math.cos(a) * rect.w * 0.25,
      ty + Math.sin(a) * rect.h * 0.12,
      tx + Math.cos(a) * rect.w * 0.4,
      ty + Math.sin(a) * rect.h * 0.22 + rect.h * 0.08
    );
    ctx.stroke();
  }
}

function drawLetterSpaced(ctx, text, cx, y, gap) {
  const widths = [];
  let total = 0;
  for (const ch of text) {
    const w = ctx.measureText(ch).width;
    widths.push(w);
    total += w + gap;
  }
  total -= gap;
  let x = cx - total / 2;
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], x, y);
    x += widths[i] + gap;
  }
}

export function drawCover(canvas, state) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  ctx.fillStyle = "#12081c";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  const rects = layoutRects(state.layout, W, H);
  const photos = state.photos || [];
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    const panel = (state.panels && state.panels[i]) || { zoom: 1, panX: 0, panY: 0, fit: "cover" };
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    let img = photos[i] || null;
    let usePanel = panel;
    if (!img && photos.length > 0) {
      img = photos[0];
      usePanel = { zoom: panel.zoom || 1, panX: (panel.panX || 0) + (i + 1) * 40, panY: (panel.panY || 0) + (i + 1) * 25, fit: panel.fit || "cover" };
    }
    if (img) {
      drawPhoto(ctx, img, rect, usePanel);
    } else {
      drawPlaceholder(ctx, rect);
    }
    drawGrade(ctx, rect, state.grade);
    ctx.restore();
  }
  if (state.vignette) {
    const vg = ctx.createRadialGradient(
      W / 2, H / 2, Math.min(W, H) * 0.35,
      W / 2, H / 2, Math.max(W, H) * 0.75
    );
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.38)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }
  if (state.grain) {
    if (!noiseCanvas) noiseCanvas = seededNoise();
    ctx.save();
    ctx.globalAlpha = 0.05;
    const pat = ctx.createPattern(noiseCanvas, "repeat");
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  const band = ctx.createLinearGradient(0, H * 0.72, 0, H);
  band.addColorStop(0, "rgba(10,4,18,0)");
  band.addColorStop(1, "rgba(10,4,18,0.85)");
  ctx.fillStyle = band;
  ctx.fillRect(0, H * 0.72, W, H * 0.28);
  const titleSize = (state.titleSize || 1) * 1;
  let size = H * 0.11 * titleSize;
  ctx.font = `${size}px Anton, sans-serif`;
  const maxW = W * 0.88;
  while (size > 12 && ctx.measureText((state.title || "").toUpperCase()).width > maxW) {
    size *= 0.92;
    ctx.font = `${size}px Anton, sans-serif`;
  }
  const subSize = H * 0.032;
  const subY = H - size * 1.9;
  const titleY = H - size * 0.55;
  ctx.font = `${subSize}px "Bebas Neue", sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.lineWidth = Math.max(1, subSize / 8);
  ctx.strokeStyle = "rgba(10,4,18,0.9)";
  const sub = (state.subtitle || "").toUpperCase();
  ctx.save();
  ctx.strokeStyle = "rgba(10,4,18,0.9)";
  ctx.lineWidth = Math.max(1, subSize / 8);
  drawLetterSpaced(ctx, sub, W / 2, subY, subSize * 0.25);
  ctx.restore();
  ctx.fillStyle = "#ffd166";
  drawLetterSpaced(ctx, sub, W / 2, subY, subSize * 0.25);
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W * 0.2, subY + subSize * 0.9);
  ctx.lineTo(W * 0.8, subY + subSize * 0.9);
  ctx.stroke();
  ctx.font = `${size}px Anton, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(255,47,146,0.55)";
  ctx.shadowBlur = size * 0.18;
  ctx.shadowOffsetY = size * 0.04;
  ctx.lineWidth = size / 12;
  ctx.strokeStyle = "rgba(10,4,18,0.9)";
  ctx.strokeText((state.title || "").toUpperCase(), W / 2, titleY);
  ctx.fillStyle = state.titleColor || "#ffffff";
  ctx.fillText((state.title || "").toUpperCase(), W / 2, titleY);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  const stampR = W * 0.035;
  const stampX = 10 + stampR + 14;
  const stampY = 10 + stampR + 14;
  ctx.beginPath();
  ctx.arc(stampX, stampY, stampR, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = `${stampR * 0.9}px "Bebas Neue", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("2026", stampX, stampY);
}
