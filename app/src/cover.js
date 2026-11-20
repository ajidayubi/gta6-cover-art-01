// app/src/cover.js

/**
 * Computes panel rectangles for the inner panel area (excluding margin/caption).
 * Layouts supported: Vice Trio, Four Corners, Hero Strip, Single.
 * Returns an array of rectangle objects { x, y, w, h }.
 */
export function computePanelRects(layout, width, height) {
  const gap = 8;
  const rects = [];

  switch (layout) {
    case 'Vice Trio': {
      // Wide hero on the left (~58% width), two stacked panels on the right
      const heroW = Math.round(width * 0.58 - gap / 2);
      const rightW = width - heroW - gap;
      const rightH = Math.round((height - gap) / 2);

      rects.push({ x: 0, y: 0, w: heroW, h: height });
      rects.push({ x: heroW + gap, y: 0, w: rightW, h: rightH });
      rects.push({ x: heroW + gap, y: rightH + gap, w: rightW, h: height - rightH - gap });
      break;
    }
    case 'Four Corners': {
      // 2x2 grid
      const w2 = Math.round((width - gap) / 2);
      const h2 = Math.round((height - gap) / 2);
      const wRemain = width - w2 - gap;
      const hRemain = height - h2 - gap;

      rects.push({ x: 0, y: 0, w: w2, h: h2 });
      rects.push({ x: w2 + gap, y: 0, w: wRemain, h: h2 });
      rects.push({ x: 0, y: h2 + gap, w: w2, h: hRemain });
      rects.push({ x: w2 + gap, y: h2 + gap, w: wRemain, h: hRemain });
      break;
    }
    case 'Hero Strip': {
      // Wide hero on top (~55% height), two panels below side by side
      const heroH = Math.round(height * 0.55 - gap / 2);
      const botH = height - heroH - gap;
      const w2 = Math.round((width - gap) / 2);
      const wRemain = width - w2 - gap;

      rects.push({ x: 0, y: 0, w: width, h: heroH });
      rects.push({ x: 0, y: heroH + gap, w: w2, h: botH });
      rects.push({ x: w2 + gap, y: heroH + gap, w: wRemain, h: botH });
      break;
    }
    case 'Single':
    default: {
      rects.push({ x: 0, y: 0, w: width, h: height });
      break;
    }
  }

  return rects;
}

/**
 * Paints the multi-panel cover with its caption block.
 * Draws the GTA VI style cover art onto the provided canvas element based on state.
 */
export function drawCover(canvas, state) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // 1. Paint canvas background very dark
  ctx.fillStyle = '#0a0812';
  ctx.fillRect(0, 0, width, height);

  // Layout & Margins
  const margin = 16;
  const frameX = margin;
  const frameY = margin;
  const frameW = width - margin * 2;
  const frameH = height - margin * 2;

  // Reserve bottom 22% of height for caption block
  const captionH = Math.round(height * 0.22);
  const innerAreaH = frameH - captionH - 12; // 12px gap between panels and caption
  const innerAreaW = frameW;
  const innerAreaX = frameX;
  const innerAreaY = frameY;

  // Draw thin pink border frame inset by margin
  ctx.strokeStyle = '#ff2a85';
  ctx.lineWidth = 2;
  ctx.strokeRect(frameX, frameY, frameW, frameH);

  // Compute panel rectangles
  const layout = state?.layout || 'Single';
  const panelRects = computePanelRects(layout, innerAreaW, innerAreaH);

  // Fallback photo acquisition helper
  const panels = Array.isArray(state?.panels) ? state.panels : [];
  const getPanelData = (index) => {
    const p = panels[index] || {};
    // Fall back to reusing the first panel photo if available
    let photo = p.photo;
    if ((!photo || !photo.complete || !photo.naturalWidth) && panels[0] && panels[0].photo && panels[0].photo.complete && panels[0].photo.naturalWidth) {
      photo = panels[0].photo;
    }
    return {
      photo,
      zoom: typeof p.zoom === 'number' ? p.zoom : 1,
      panX: typeof p.panX === 'number' ? p.panX : 0,
      panY: typeof p.panY === 'number' ? p.panY : 0,
      fit: p.fit === 'fit' ? 'fit' : 'cover'
    };
  };

  // Helper for drawing fallback sunset gradient & palm silhouette
  const drawFallbackSunset = (pCtx, rx, ry, rw, rh) => {
    pCtx.save();
    pCtx.beginPath();
    pCtx.rect(0, 0, rw, rh);
    pCtx.clip();

    // Sunset gradient
    const grad = pCtx.createLinearGradient(0, 0, 0, rh);
    grad.addColorStop(0, '#1a0536');
    grad.addColorStop(0.4, '#b83280');
    grad.addColorStop(0.75, '#ff7e33');
    grad.addColorStop(1, '#ffe552');
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, rw, rh);

    // Sun disc
    pCtx.fillStyle = '#fffae6';
    pCtx.beginPath();
    pCtx.arc(rw * 0.7, rh * 0.5, rh * 0.22, 0, Math.PI * 2);
    pCtx.fill();

    // Palm silhouette (stylized vector)
    pCtx.fillStyle = '#0a0314';
    const trunkX = rw * 0.35;
    const trunkBaseY = rh;
    const trunkTopY = rh * 0.45;
    
    pCtx.beginPath();
    pCtx.moveTo(trunkX - rw * 0.03, trunkBaseY);
    pCtx.quadraticCurveTo(trunkX - rw * 0.01, (trunkBaseY + trunkTopY) / 2, trunkX - rw * 0.01, trunkTopY);
    pCtx.lineTo(trunkX + rw * 0.01, trunkTopY);
    pCtx.quadraticCurveTo(trunkX + rw * 0.02, (trunkBaseY + trunkTopY) / 2, trunkX + rw * 0.04, trunkBaseY);
    pCtx.closePath();
    pCtx.fill();

    // Fronds
    const drawFrond = (angle, len) => {
      pCtx.save();
      pCtx.translate(trunkX, trunkTopY);
      pCtx.rotate(angle);
      pCtx.beginPath();
      pCtx.moveTo(0, 0);
      pCtx.quadraticCurveTo(len * 0.5, -len * 0.1, len, len * 0.2);
      pCtx.quadraticCurveTo(len * 0.5, len * 0.1, 0, 0);
      pCtx.fillStyle = '#0a0314';
      pCtx.fill();
      pCtx.restore();
    };

    drawFrond(-0.8, rw * 0.45);
    drawFrond(-0.4, rw * 0.55);
    drawFrond(0.0, rw * 0.6);
    drawFrond(0.4, rw * 0.52);
    drawFrond(0.8, rw * 0.42);

    pCtx.restore();
  };

  // Draw each panel
  panelRects.forEach((rect, index) => {
    ctx.save();
    // Clip to panel rounded or sharp rect (using sharp rect with thin divider stroke between panels)
    ctx.beginPath();
    ctx.rect(innerAreaX + rect.x, innerAreaY + rect.y, rect.w, rect.h);
    ctx.clip();

    // Panel background fill
    ctx.fillStyle = '#120c1f';
    ctx.fillRect(innerAreaX + rect.x, innerAreaY + rect.y, rect.w, rect.h);

    const { photo, zoom, panX, panY, fit } = getPanelData(index);

    if (photo && photo.complete && photo.naturalWidth) {
      // Draw uploaded photo with zoom, pan, and fit
      const imgW = photo.naturalWidth;
      const imgH = photo.naturalHeight;
      const pW = rect.w;
      const pH = rect.h;

      let drawW, drawH, drawX, drawY;

      if (fit === 'fit') {
        const scale = Math.min(pW / imgW, pH / imgH) * zoom;
        drawW = imgW * scale;
        drawH = imgH * scale;
        drawX = innerAreaX + rect.x + (pW - drawW) / 2 + panX;
        drawY = innerAreaY + rect.y + (pH - drawH) / 2 + panY;
      } else {
        // cover
        const scale = Math.max(pW / imgW, pH / imgH) * zoom;
        drawW = imgW * scale;
        drawH = imgH * scale;
        drawX = innerAreaX + rect.x + (pW - drawW) / 2 + panX;
        drawY = innerAreaY + rect.y + (pH - drawH) / 2 + panY;
      }

      ctx.drawImage(photo, drawX, drawY, drawW, drawH);
    } else {
      // Fallback sunset art
      drawFallbackSunset(ctx, innerAreaX + rect.x, innerAreaY + rect.y, rect.w, rect.h);
    }

    // Apply color grade filter per panel if specified
    const pState = panels[index] || {};
    const grade = pState.grade || 'sunset';

    ctx.save();
    ctx.beginPath();
    ctx.rect(innerAreaX + rect.x, innerAreaY + rect.y, rect.w, rect.h);
    ctx.clip();

    if (grade === 'sunset') {
      const g = ctx.createLinearGradient(innerAreaX + rect.x, innerAreaY + rect.y, innerAreaX + rect.x, innerAreaY + rect.y + rect.h);
      g.addColorStop(0, 'rgba(255, 42, 133, 0.22)');
      g.addColorStop(0.5, 'rgba(255, 126, 51, 0.15)');
      g.addColorStop(1, 'rgba(15, 5, 30, 0.35)');
      ctx.fillStyle = g;
      ctx.fillRect(innerAreaX + rect.x, innerAreaY + rect.y, rect.w, rect.h);
    } else if (grade === 'neon') {
      const g = ctx.createLinearGradient(innerAreaX + rect.x, innerAreaY + rect.y, innerAreaX + rect.x + rect.w, innerAreaY + rect.y + rect.h);
      g.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
      g.addColorStop(1, 'rgba(255, 0, 128, 0.25)');
      ctx.fillStyle = g;
      ctx.fillRect(innerAreaX + rect.x, innerAreaY + rect.y, rect.w, rect.h);
    } else if (grade === 'noir') {
      ctx.fillStyle = 'rgba(10, 5, 20, 0.45)';
      ctx.fillRect(innerAreaX + rect.x, innerAreaY + rect.y, rect.w, rect.h);
    } else if (grade === 'golden') {
      const g = ctx.createLinearGradient(innerAreaX + rect.x, innerAreaY + rect.y, innerAreaX + rect.x, innerAreaY + rect.y + rect.h);
      g.addColorStop(0, 'rgba(255, 215, 0, 0.25)');
      g.addColorStop(1, 'rgba(180, 80, 20, 0.3)');
      ctx.fillStyle = g;
      ctx.fillRect(innerAreaX + rect.x, innerAreaY + rect.y, rect.w, rect.h);
    }

    ctx.restore();
    ctx.restore();
  });

  // Draw panel divider strokes
  ctx.save();
  ctx.strokeStyle = '#0a0812';
  ctx.lineWidth = 4;
  panelRects.forEach((rect) => {
    ctx.strokeRect(innerAreaX + rect.x, innerAreaY + rect.y, rect.w, innerAreaH);
  });
  ctx.restore();

  // Film grain (if enabled)
  if (state?.grain) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(innerAreaX, innerAreaY, innerAreaW, innerAreaH);
    ctx.clip();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    // Draw scattered faint dots
    const dotCount = Math.round((innerAreaW * innerAreaH) / 350);
    for (let i = 0; i < dotCount; i++) {
      const gx = innerAreaX + Math.random() * innerAreaW;
      const gy = innerAreaY + Math.random() * innerAreaH;
      ctx.fillRect(gx, gy, 1, 1);
    }
    ctx.restore();
  }

  // Dark vignette at the edges (if enabled)
  if (state?.vignette) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(innerAreaX, innerAreaY, innerAreaW, innerAreaH);
    ctx.clip();

    const vigGrad = ctx.createRadialGradient(
      innerAreaX + innerAreaW / 2, innerAreaY + innerAreaH / 2, innerAreaH * 0.3,
      innerAreaX + innerAreaW / 2, innerAreaY + innerAreaH / 2, innerAreaH * 0.8
    );
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(1, 'rgba(5, 2, 10, 0.65)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(innerAreaX, innerAreaY, innerAreaW, innerAreaH);
    ctx.restore();
  }

  // Draw small gold-ringed circular stamp reading "2026" in the top-left corner of the panel area
  ctx.save();
  const stampX = innerAreaX + 28;
  const stampY = innerAreaY + 28;
  const stampR = 20;

  ctx.fillStyle = 'rgba(15, 10, 25, 0.75)';
  ctx.beginPath();
  ctx.arc(stampX, stampY, stampR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(stampX, stampY, stampR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('2026', stampX, stampY);
  ctx.restore();

  // ----------------------------------------------------
  // CAPTION BLOCK (Bottom 22% of height)
  // ----------------------------------------------------
  const captionY = frameY + frameH - captionH;
  const captionX = frameX + 12;
  const captionW = frameW - 24;

  const subtitleText = (state?.subtitle || 'VICE CITY STORIES').toUpperCase();
  const titleText = (state?.title || 'PARADISE LOST').toUpperCase();
  const titleColor = state?.titleColor || '#ffd700';
  const sizeMult = typeof state?.titleSize === 'number' ? state.titleSize : 1;

  ctx.save();
  ctx.beginPath();
  ctx.rect(frameX, captionY - 10, frameW, captionH + 10);
  ctx.clip();

  // Layout vertical positions within caption block
  // We want:
  // 1. Subtitle at top of caption block
  // 2. Thin gold rule beneath subtitle with a short gap in its middle
  // 3. Main title below rule with baseline near the bottom of canvas/frame
  
  const subFontSize = Math.max(12, Math.round(captionH * 0.22));
  ctx.font = `${subFontSize}px "Bebas Neue", Impact, sans-serif`;
  ctx.textBaseline = 'top';

  // Letterspace subtitle
  const letterSpace = 3;
  const subX = captionX;
  const subY = captionY + 4;

  ctx.lineWidth = 2;
  ctx.strokeStyle = '#050308';
  ctx.fillStyle = '#ffd700';

  // Draw letterspaced subtitle with dark outline and gold fill
  let curX = subX;
  for (let i = 0; i < subtitleText.length; i++) {
    const char = subtitleText[i];
    ctx.strokeText(char, curX, subY);
    ctx.fillText(char, curX, subY);
    curX += ctx.measureText(char).width + letterSpace;
  }

  // Thin gold rule beneath subtitle with a short gap in its middle (centred under the subtitle)
  const ruleY = subY + subFontSize + 6;
  const fullRuleWidth = captionW * 0.85;
  const gapWidth = 24;
  const leftRuleEnd = captionX + (fullRuleWidth - gapWidth) / 2;
  const rightRuleStart = leftRuleEnd + gapWidth;

  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(captionX, ruleY);
  ctx.lineTo(leftRuleEnd, ruleY);
  ctx.moveTo(rightRuleStart, ruleY);
  ctx.lineTo(captionX + fullRuleWidth, ruleY);
  ctx.stroke();

  // Main title below rule in heavy condensed font Anton in uppercase
  // Size the title from the reserved caption height so subtitle, rule, and title all fit
  // with title baseline above the bottom edge of canvas. Shrink title only if wider than most of cover width.
  let baseTitleFontSize = Math.round(captionH * 0.65 * sizeMult);
  ctx.font = `900 ${baseTitleFontSize}px Anton, Impact, sans-serif`;

  let titleMetrics = ctx.measureText(titleText);
  const maxTitleWidth = frameW * 0.95;
  if (titleMetrics.width > maxTitleWidth) {
    const scaleDown = maxTitleWidth / titleMetrics.width;
    baseTitleFontSize = Math.max(16, Math.round(baseTitleFontSize * scaleDown));
    ctx.font = `900 ${baseTitleFontSize}px Anton, Impact, sans-serif`;
    titleMetrics = ctx.measureText(titleText);
  }

  const titleX = captionX;
  const titleBaselineY = frameY + frameH - 12; // bottom edge inside frame

  // Magenta drop shadow
  ctx.save();
  ctx.shadowColor = '#ff2a85';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;

  // Dark outline
  ctx.lineWidth = Math.max(3, Math.round(baseTitleFontSize * 0.08));
  ctx.strokeStyle = '#050308';
  ctx.fillStyle = titleColor;

  ctx.textBaseline = 'alphabetic';
  ctx.strokeText(titleText, titleX, titleBaselineY);
  ctx.fillText(titleText, titleX, titleBaselineY);
  ctx.restore();

  ctx.restore();
}
