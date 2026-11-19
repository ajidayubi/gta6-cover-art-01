/**
 * Vice Cover Maker - Cover Renderer (app/src/cover.js)
 * Draws multi-panel GTA-style poster covers onto a canvas based on state.
 */

// Seeded pseudo-random generator (LCG) for reproducible grain pattern
function createSeededRandom(seed = 1337) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Global cached grain pattern canvas so it's generated once
let cachedGrainPattern = null;
let cachedGrainWidth = 0;
let cachedGrainHeight = 0;

function getGrainPattern(ctx, width, height) {
  if (cachedGrainPattern && cachedGrainWidth === width && cachedGrainHeight === height) {
    return cachedGrainPattern;
  }
  const patternCanvas = document.createElement('canvas');
  patternCanvas.width = width;
  patternCanvas.height = height;
  const pCtx = patternCanvas.getContext('2d');
  const imgData = pCtx.createImageData(width, height);
  const data = imgData.data;
  const rnd = createSeededRandom(42);

  for (let i = 0; i < data.length; i += 4) {
    const val = Math.floor(rnd() * 255);
    data[i] = val;     // R
    data[i + 1] = val; // G
    data[i + 2] = val; // B
    data[i + 3] = 28;  // Alpha (~11% opacity noise)
  }
  pCtx.putImageData(imgData, 0, 0);
  cachedGrainPattern = ctx.createPattern(patternCanvas, 'repeat');
  cachedGrainWidth = width;
  cachedGrainHeight = height;
  return cachedGrainPattern;
}

/**
 * Computes panel rectangles for a given layout name and canvas width/height.
 * Layouts:
 * - "Vice Trio": Hero panel on left taking most width, 2 stacked panels on right.
 * - "Four Corners": 2x2 grid.
 * - "Hero Strip": Full-width top hero, 2 panels side-by-side below.
 * - "Single": Single panel filling the inside.
 */
export function computePanelRects(layout, width, height) {
  // Border and gap settings relative to canvas size
  const border = Math.round(width * 0.02);
  const gap = Math.round(width * 0.012);

  // Available drawing area inside outer border
  const innerX = border;
  const innerY = border;
  const innerW = width - border * 2;
  // Reserve space at bottom for caption block (approx 22% of height)
  const captionReserved = Math.round(height * 0.22);
  const innerH = height - border * 2 - captionReserved;

  const rects = [];

  if (layout === 'Vice Trio') {
    // Left hero panel takes ~58% width
    const leftW = Math.round(innerW * 0.58 - gap / 2);
    const rightW = innerW - leftW - gap;
    const rightH = Math.round((innerH - gap) / 2);

    rects.push({ x: innerX, y: innerY, w: leftW, h: innerH }); // Panel 0 (Hero left)
    rects.push({ x: innerX + leftW + gap, y: innerY, w: rightW, h: rightH }); // Panel 1 (Top right)
    rects.push({ x: innerX + leftW + gap, y: innerY + rightH + gap, w: rightW, h: innerH - rightH - gap }); // Panel 2 (Bottom right)
  } else if (layout === 'Four Corners') {
    // 2x2 grid
    const halfW = Math.round((innerW - gap) / 2);
    const halfH = Math.round((innerH - gap) / 2);
    rects.push({ x: innerX, y: innerY, w: halfW, h: halfH }); // Top-left
    rects.push({ x: innerX + halfW + gap, y: innerY, w: innerW - halfW - gap, h: halfH }); // Top-right
    rects.push({ x: innerX, y: innerY + halfH + gap, w: halfW, h: innerH - halfH - gap }); // Bottom-left
    rects.push({ x: innerX + halfW + gap, y: innerY + halfH + gap, w: innerW - halfW - gap, h: innerH - halfH - gap }); // Bottom-right
  } else if (layout === 'Hero Strip') {
    // Top hero full width, two panels below side-by-side
    const topH = Math.round(innerH * 0.55 - gap / 2);
    const bottomH = innerH - topH - gap;
    const bottomW = Math.round((innerW - gap) / 2);

    rects.push({ x: innerX, y: innerY, w: innerW, h: topH }); // Top hero
    rects.push({ x: innerX, y: innerY + topH + gap, w: bottomW, h: bottomH }); // Bottom left
    rects.push({ x: innerX + bottomW + gap, y: innerY + topH + gap, w: innerW - bottomW - gap, h: bottomH }); // Bottom right
  } else {
    // "Single" or fallback
    rects.push({ x: innerX, y: innerY, w: innerW, h: innerH });
  }

  return rects;
}

/**
 * Draws a sunset gradient placeholder with palm silhouettes when no photo is available.
 */
function drawPlaceholder(ctx, rect, panelIndex) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  // Vary colors slightly per panel index for visual diversity
  if (panelIndex % 2 === 0) {
    grad.addColorStop(0, '#ff7ad9');
    grad.addColorStop(0.5, '#ff5e4d');
    grad.addColorStop(1, '#ffb703');
  } else {
    grad.addColorStop(0, '#7209b7');
    grad.addColorStop(0.5, '#f72585');
    grad.addColorStop(1, '#4cc9f0');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  // Draw simple stylized palm silhouette
  ctx.fillStyle = 'rgba(15, 10, 25, 0.75)';
  const trunkX = rect.x + rect.w * (0.3 + (panelIndex * 0.15) % 0.4);
  const trunkBaseY = rect.y + rect.h;
  const trunkTopY = rect.y + rect.h * 0.4;

  // Curved trunk
  ctx.beginPath();
  ctx.moveTo(trunkX - rect.w * 0.04, trunkBaseY);
  ctx.quadraticCurveTo(trunkX + rect.w * 0.05, rect.y + rect.h * 0.7, trunkX, trunkTopY);
  ctx.lineTo(trunkX + rect.w * 0.02, trunkTopY);
  ctx.quadraticCurveTo(trunkX + rect.w * 0.08, rect.y + rect.h * 0.7, trunkX + rect.w * 0.04, trunkBaseY);
  ctx.closePath();
  ctx.fill();

  // Fronds (arcs / curved leaves)
  const frondCenterY = trunkTopY;
  ctx.lineWidth = Math.max(2, rect.w * 0.015);
  ctx.strokeStyle = 'rgba(15, 10, 25, 0.85)';
  const angles = [-Math.PI * 0.85, -Math.PI * 0.6, -Math.PI * 0.35, -Math.PI * 0.1, Math.PI * 0.15];
  angles.forEach((ang, idx) => {
    ctx.beginPath();
    ctx.moveTo(trunkX, frondCenterY);
    const tipX = trunkX + Math.cos(ang) * (rect.w * 0.25);
    const tipY = frondCenterY + Math.sin(ang) * (rect.h * 0.22) + (idx % 2) * rect.h * 0.05;
    const cpX = trunkX + Math.cos(ang) * (rect.w * 0.15);
    const cpY = frondCenterY + Math.sin(ang) * (rect.h * 0.1) - rect.h * 0.08;
    ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
    ctx.stroke();
  });
}

/**
 * Draws the cover onto a canvas from the given state object.
 * Does not await anything (fonts must be pre-loaded by caller).
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // 1. Fill cover near-black background
  ctx.fillStyle = '#0a0812';
  ctx.fillRect(0, 0, width, height);

  // 2. Compute panel rectangles
  const layout = state.layout || 'Vice Trio';
  const rects = computePanelRects(layout, width, height);

  // 3. Draw white outer border and white gaps between panels
  // We can fill the background white first inside outer area, or draw strokes.
  const border = Math.round(width * 0.02);
  const gap = Math.round(width * 0.012);
  const captionReserved = Math.round(height * 0.22);
  const innerX = border;
  const innerY = border;
  const innerW = width - border * 2;
  const innerH = height - border * 2 - captionReserved;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(innerX, innerY, innerW, innerH);

  // 4. For each panel, clip and draw photo or placeholder
  const panels = state.panels || [];
  rects.forEach((rect, index) => {
    ctx.save();
    // Inner panel area slightly inset to show white gap/border around it
    const panelInset = Math.round(gap * 0.6);
    const pX = rect.x + panelInset / 2;
    const pY = rect.y + panelInset / 2;
    const pW = rect.w - panelInset;
    const pH = rect.h - panelInset;

    ctx.beginPath();
    ctx.rect(pX, pY, pW, pH);
    ctx.clip();

    // Fill panel background dark before drawing photo
    ctx.fillStyle = '#120d20';
    ctx.fillRect(pX, pY, pW, pH);

    const panelData = panels[index] || {};
    const photo = panelData.photo;

    // Fallback or reuse logic: if no photo in this panel, reuse photo 0 or placeholder
    let targetPhoto = photo;
    if (!targetPhoto && panels[0] && panels[0].photo) {
      targetPhoto = panels[0].photo;
    }

    if (targetPhoto && targetPhoto.complete && targetPhoto.naturalWidth > 0) {
      // Draw photo honouring zoom, pan, fit mode
      const imgW = targetPhoto.naturalWidth;
      const imgH = targetPhoto.naturalHeight;
      const imgAspect = imgW / imgH;
      const panelAspect = pW / pH;

      const fitMode = panelData.fit || 'cover'; // 'cover' or 'fit'
      const zoom = panelData.zoom || 1.0;
      const panX = panelData.panX || 0; // pixel offset or normalized
      const panY = panelData.panY || 0;

      let drawW, drawH, drawX, drawY;

      if (fitMode === 'cover') {
        // Cover fit: fill panel completely, cropping excess
        if (imgAspect > panelAspect) {
          drawH = pH * zoom;
          drawW = drawH * imgAspect;
        } else {
          drawW = pW * zoom;
          drawH = drawW / imgAspect;
        }
      } else {
        // Fit mode: letterbox whole photo visible
        if (imgAspect > panelAspect) {
          drawW = pW * zoom;
          drawH = drawW / imgAspect;
        } else {
          drawH = pH * zoom;
          drawW = drawH * imgAspect;
        }
      }

      // Center with pan offsets (panX/panY normalized -1 to 1 or pixel values)
      drawX = pX + (pW - drawW) / 2 + panX * (pW * 0.5);
      drawY = pY + (pH - drawH) / 2 + panY * (pH * 0.5);

      ctx.drawImage(targetPhoto, drawX, drawY, drawW, drawH);

      // If reusing photo for panels > 0 and no specific pan was set, apply slight varied crop offset
      if (!photo && index > 0) {
        // subtle distinct tint or shade overlay to differentiate reused panels
        ctx.fillStyle = 'rgba(10, 5, 20, 0.15)';
        ctx.fillRect(pX, pY, pW, pH);
      }
    } else {
      // Placeholder with palm silhouettes
      drawPlaceholder(ctx, { x: pX, y: pY, w: pW, h: pH }, index);
    }

    ctx.restore();
  });

  // 5. Apply chosen colour grade overlay
  const grade = state.grade || 'Sunset';
  ctx.save();
  // We draw over the panel area (inner area)
  ctx.beginPath();
  ctx.rect(innerX, innerY, innerW, innerH);
  ctx.clip();

  if (grade === 'Sunset') {
    // Sunset gradient: warm orange to magenta with a purple multiply wash
    const sunsetGrad = ctx.createLinearGradient(innerX, innerY, innerX + innerW, innerY + innerH);
    sunsetGrad.addColorStop(0, 'rgba(255, 140, 60, 0.35)');
    sunsetGrad.addColorStop(0.5, 'rgba(230, 40, 130, 0.3)');
    sunsetGrad.addColorStop(1, 'rgba(114, 9, 183, 0.4)');
    ctx.fillStyle = sunsetGrad;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillRect(innerX, innerY, innerW, innerH);

    ctx.fillStyle = 'rgba(70, 10, 90, 0.25)';
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillRect(innerX, innerY, innerW, innerH);
  } else if (grade === 'Neon') {
    // Neon diagonal cyan-to-pink overlay blend
    const neonGrad = ctx.createLinearGradient(innerX, innerY, innerX + innerW, innerY + innerH);
    neonGrad.addColorStop(0, 'rgba(0, 245, 255, 0.35)');
    neonGrad.addColorStop(0.5, 'rgba(120, 20, 180, 0.25)');
    neonGrad.addColorStop(1, 'rgba(255, 20, 147, 0.4)');
    ctx.fillStyle = neonGrad;
    ctx.globalCompositeOperation = 'color-burn';
    ctx.fillRect(innerX, innerY, innerW, innerH);
  } else if (grade === 'Vice') {
    // Vice purple-to-teal soft-light wash with a pink glow at the bottom
    const viceGrad = ctx.createLinearGradient(innerX, innerY, innerX, innerY + innerH);
    viceGrad.addColorStop(0, 'rgba(90, 24, 154, 0.35)');
    viceGrad.addColorStop(0.7, 'rgba(0, 180, 160, 0.2)');
    viceGrad.addColorStop(1, 'rgba(255, 45, 120, 0.45)');
    ctx.fillStyle = viceGrad;
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillRect(innerX, innerY, innerW, innerH);
  } else if (grade === 'Noir') {
    // Noir grey wash with a warm highlight at the top
    const noirGrad = ctx.createLinearGradient(innerX, innerY, innerX, innerY + innerH);
    noirGrad.addColorStop(0, 'rgba(240, 220, 180, 0.25)');
    noirGrad.addColorStop(0.3, 'rgba(80, 80, 90, 0.3)');
    noirGrad.addColorStop(1, 'rgba(10, 10, 15, 0.6)');
    ctx.fillStyle = noirGrad;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillRect(innerX, innerY, innerW, innerH);
  }
  ctx.restore();

  // 6. Radial vignette darkening the corners when enabled
  if (state.vignette !== false) {
    ctx.save();
    const cx = width / 2;
    const cy = (innerY + innerH) / 2;
    const radius = Math.max(width, height) * 0.75;
    const vigGrad = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius);
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(0.6, 'rgba(5, 3, 10, 0.3)');
    vigGrad.addColorStop(1, 'rgba(5, 2, 10, 0.85)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 7. Deterministic seeded-noise grain pattern tiled at low opacity when enabled
  if (state.grain !== false) {
    ctx.save();
    const grainPattern = getGrainPattern(ctx, 128, 128);
    if (grainPattern) {
      ctx.fillStyle = grainPattern;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  }

  // 8. Caption block last:
  // Dark gradient band across the bottom
  const captionY = height - captionReserved - Math.round(border * 0.5);
  const captionH = captionReserved + Math.round(border * 0.5);

  ctx.save();
  const bandGrad = ctx.createLinearGradient(0, captionY, 0, height);
  bandGrad.addColorStop(0, 'rgba(10, 8, 16, 0)');
  bandGrad.addColorStop(0.25, 'rgba(10, 8, 16, 0.92)');
  bandGrad.addColorStop(1, 'rgba(5, 4, 10, 0.98)');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, captionY - Math.round(captionH * 0.3), width, captionH + Math.round(captionH * 0.3));

  // Small circular stamp in the top-left corner holding the year 2026
  const stampX = border + Math.round(width * 0.035);
  const stampY = border + Math.round(width * 0.035);
  const stampR = Math.round(width * 0.028);

  ctx.save();
  ctx.beginPath();
  ctx.arc(stampX, stampY, stampR, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 12, 25, 0.85)';
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = Math.max(1.5, width * 0.002);
  ctx.fill();
  ctx.stroke();

  // Year 2026 inside stamp
  ctx.fillStyle = '#ffd166';
  ctx.font = `bold ${Math.round(stampR * 0.65)}px 'Bebas Neue', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('2026', stampX, stampY + 1);
  ctx.restore();

  // Subtitle: tall narrow font letterspaced in gold with thin dark outline
  const subText = (state.subtitle || 'NEON SUNSET • 2026').toUpperCase();
  const subFontSize = Math.max(12, Math.round(width * 0.022));
  ctx.font = `${subFontSize}px 'Bebas Neue', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  const subBaselineY = height - Math.round(captionH * 0.38);

  // Letterspaced drawing helper for subtitle
  drawLetterSpacedText(ctx, subText, width / 2, subBaselineY, subFontSize * 0.22, '#ffd166', '#050308', Math.max(1, width * 0.0015));

  // Thin white rule
  const ruleW = Math.round(width * 0.35);
  const ruleY = subBaselineY + Math.round(width * 0.012);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = Math.max(1.5, width * 0.0018);
  ctx.beginPath();
  ctx.moveTo(width / 2 - ruleW / 2, ruleY);
  ctx.lineTo(width / 2 + ruleW / 2, ruleY);
  ctx.stroke();

  // Main title: heavy condensed font uppercase and centred in chosen colour
  // with a thick dark outline and a soft magenta drop shadow, shrinking until it fits most cover width.
  const titleText = (state.title || 'SUNSET HEIST').toUpperCase();
  const titleColor = state.titleColor || '#ffffff';
  const sizeMultiplier = state.titleSize !== undefined ? state.titleSize : 1.0;

  // Initial font size estimation based on caption height (captionReserved), scaling by sizeMultiplier
  let titleFontSize = Math.round(captionReserved * 0.42 * sizeMultiplier);
  ctx.font = `900 ${titleFontSize}px 'Anton', sans-serif`;

  // Measure and shrink if it exceeds ~85% of cover width
  const maxTitleWidth = width * 0.88;
  let metrics = ctx.measureText(titleText);
  while (metrics.width > maxTitleWidth && titleFontSize > 20) {
    titleFontSize -= 2;
    ctx.font = `900 ${titleFontSize}px 'Anton', sans-serif`;
    metrics = ctx.measureText(titleText);
  }

  const titleBaselineY = ruleY + Math.round(titleFontSize * 0.88);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Soft magenta drop shadow
  ctx.shadowColor = 'rgba(255, 45, 120, 0.75)';
  ctx.shadowBlur = Math.round(titleFontSize * 0.25);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(titleFontSize * 0.08);

  // Thick dark outline
  ctx.lineWidth = Math.max(3, titleFontSize * 0.09);
  ctx.strokeStyle = '#080510';
  ctx.lineJoin = 'round';
  ctx.strokeText(titleText, width / 2, titleBaselineY);

  // Fill text with chosen colour
  ctx.fillStyle = titleColor;
  ctx.fillText(titleText, width / 2, titleBaselineY);

  ctx.restore();
  ctx.restore();
}

/**
 * Helper to draw letter-spaced text (for subtitle)
 */
function drawLetterSpacedText(ctx, text, x, y, letterSpacing, fillColor, outlineColor, lineWidth) {
  ctx.save();
  const chars = text.split('');
  // Measure total width with letter spacing
  let totalWidth = 0;
  const widths = chars.map(c => {
    const w = ctx.measureText(c).width;
    totalWidth += w + letterSpacing;
    return w;
  });
  totalWidth -= letterSpacing;

  let currentX = x - totalWidth / 2;
  chars.forEach((c, i) => {
    const charW = widths[i];
    const charX = currentX + charW / 2;

    // Outline
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = outlineColor;
    ctx.lineJoin = 'round';
    ctx.strokeText(c, charX, y);

    // Fill
    ctx.fillStyle = fillColor;
    ctx.fillText(c, charX, y);

    currentX += charW + letterSpacing;
  });
  ctx.restore();
}
