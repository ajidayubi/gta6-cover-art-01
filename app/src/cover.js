/**
 * GTA VI Cover Art Generator - cover.js
 * Exports drawCover(canvas, state) and computePanelRects(layout, width, height).
 */

/**
 * Computes panel rectangles for the inner area of the given dimensions.
 * Inner area is defined by the outer frame / margin and the caption reservation at the bottom.
 * Note: computePanelRects can be called independently (e.g. by UI or tests) with total width/height
 * or inner width/height depending on context, but let's make sure it handles layout correctly.
 * The prompt states: computePanelRects takes a layout name, a width and a height and returns the panel rectangles for that layout.
 */
export function computePanelRects(layout, width, height) {
  const gap = 8;
  const rects = [];

  switch (layout) {
    case 'Vice Trio': {
      // Wide hero on the left (~58% of width), two stacked on the right
      const leftW = Math.round((width - gap) * 0.58);
      const rightW = width - leftW - gap;
      const rightH = Math.round((height - gap) / 2);

      rects.push({ x: 0, y: 0, w: leftW, h: height }); // panel 0: left hero
      rects.push({ x: leftW + gap, y: 0, w: rightW, h: rightH }); // panel 1: top right
      rects.push({ x: leftW + gap, y: rightH + gap, w: rightW, h: height - rightH - gap }); // panel 2: bottom right
      break;
    }
    case 'Four Corners': {
      // 2x2 grid
      const halfW = Math.round((width - gap) / 2);
      const halfH = Math.round((height - gap) / 2);
      const rightW = width - halfW - gap;
      const bottomH = height - halfH - gap;

      rects.push({ x: 0, y: 0, w: halfW, h: halfH }); // top-left
      rects.push({ x: halfW + gap, y: 0, w: rightW, h: halfH }); // top-right
      rects.push({ x: 0, y: halfH + gap, w: halfW, h: bottomH }); // bottom-left
      rects.push({ x: halfW + gap, y: halfH + gap, w: rightW, h: bottomH }); // bottom-right
      break;
    }
    case 'Hero Strip': {
      // Wide hero on top (~55% of height), two panels below side-by-side
      const topH = Math.round((height - gap) * 0.55);
      const bottomH = height - topH - gap;
      const halfW = Math.round((width - gap) / 2);
      const rightW = width - halfW - gap;

      rects.push({ x: 0, y: 0, w: width, h: topH }); // top hero
      rects.push({ x: 0, y: topH + gap, w: halfW, h: bottomH }); // bottom left
      rects.push({ x: halfW + gap, y: topH + gap, w: rightW, h: bottomH }); // bottom right
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
 * Draws the complete GTA VI cover art onto the canvas.
 */
export function drawCover(canvas, state) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // 1. Paint canvas background very dark
  ctx.fillStyle = '#0a0510';
  ctx.fillRect(0, 0, width, height);

  // Frame and layout dimensions
  const frameMargin = 12;
  const frameX = frameMargin;
  const frameY = frameMargin;
  const frameW = width - frameMargin * 2;
  const frameH = height - frameMargin * 2;

  // Reserve bottom 22% of height for caption block
  const captionH = Math.round(frameH * 0.22);
  const innerAreaH = frameH - captionH - 8; // small padding between panels and caption
  const innerAreaW = frameW;

  // Save state for clipping inner area
  ctx.save();
  ctx.translate(frameX, frameY);

  // Clip to inner panel area
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, innerAreaW, innerAreaH);
  ctx.clip();

  // Draw panels
  const layout = state.layout || 'Single';
  const panels = state.panels || [];
  const panelRects = computePanelRects(layout, innerAreaW, innerAreaH);

  // Fallback photo acquisition: first available photo in panels
  let fallbackPhoto = null;
  for (const p of panels) {
    if (p && p.complete && p.naturalWidth > 0) {
      fallbackPhoto = p;
      break;
    }
  }

  panelRects.forEach((rect, index) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();

    // Background fill for panel before image/fallback
    ctx.fillStyle = '#150922';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    const panelState = panels[index] || {};
    let photo = panelState.photo;
    if (!photo || !photo.complete || photo.naturalWidth === 0) {
      photo = fallbackPhoto;
    }

    if (photo && photo.complete && photo.naturalWidth > 0) {
      // Draw photo honouring zoom, pan, fit mode
      const zoom = typeof panelState.zoom === 'number' ? panelState.zoom : 1;
      const panX = typeof panelState.panX === 'number' ? panelState.panX : 0; // percentage or pixels? Usually normalized or pixel offset. Let's support standard offset or center.
      const panY = typeof panelState.panY === 'number' ? panelState.panY : 0;
      const fit = panelState.fit || 'cover';

      const imgW = photo.naturalWidth;
      const imgH = photo.naturalHeight;

      let drawW, drawH, drawX, drawY;

      if (fit === 'cover') {
        const scale = Math.max(rect.w / imgW, rect.h / imgH) * zoom;
        drawW = imgW * scale;
        drawH = imgH * scale;
        // Center with pan offset
        drawX = rect.x + (rect.w - drawW) / 2 + panX;
        drawY = rect.y + (rect.h - drawH) / 2 + panY;
      } else {
        // fit ('fit' / letterbox)
        const scale = Math.min(rect.w / imgW, rect.h / imgH) * zoom;
        drawW = imgW * scale;
        drawH = imgH * scale;
        drawX = rect.x + (rect.w - drawW) / 2 + panX;
        drawY = rect.y + (rect.h - drawH) / 2 + panY;
      }

      ctx.drawImage(photo, drawX, drawY, drawW, drawH);
    } else {
      // Fallback: sunset gradient with palm silhouette
      const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
      grad.addColorStop(0, '#ff7733');
      grad.addColorStop(0.5, '#ff2288');
      grad.addColorStop(1, '#330066');
      ctx.fillStyle = grad;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

      // Draw stylized sun
      ctx.fillStyle = '#ffee55';
      ctx.beginPath();
      ctx.arc(rect.x + rect.w * 0.5, rect.y + rect.h * 0.4, Math.min(rect.w, rect.h) * 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Simple palm silhouette
      ctx.fillStyle = '#0a0510';
      ctx.beginPath();
      const px = rect.x + rect.w * 0.7;
      const py = rect.y + rect.h;
      ctx.moveTo(px - 4, py);
      ctx.lineTo(px + 4, py);
      ctx.lineTo(px + 2, py - rect.h * 0.6);
      ctx.lineTo(px - 2, py - rect.h * 0.6);
      ctx.fill();
      // Palm fronds
      ctx.strokeStyle = '#0a0510';
      ctx.lineWidth = 3;
      const topY = py - rect.h * 0.6;
      [-0.8, -0.4, 0, 0.4, 0.8].forEach(angle => {
        ctx.beginPath();
        ctx.moveTo(px, topY);
        ctx.quadraticCurveTo(px + angle * 30, topY - 20, px + angle * 50, topY + Math.abs(angle) * 15);
        ctx.stroke();
      });
    }

    ctx.restore();
  });

  // 2. Apply colour grade as translucent overlay over panel area
  const grade = state.grade || 'Sunset';
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, innerAreaW, innerAreaH);
  ctx.clip();

  if (grade === 'Sunset') {
    const gradeGrad = ctx.createLinearGradient(0, 0, innerAreaW, innerAreaH);
    gradeGrad.addColorStop(0, 'rgba(255, 119, 0, 0.2)');
    gradeGrad.addColorStop(1, 'rgba(255, 0, 128, 0.25)');
    ctx.fillStyle = gradeGrad;
    ctx.fillRect(0, 0, innerAreaW, innerAreaH);
  } else if (grade === 'Neon') {
    const gradeGrad = ctx.createLinearGradient(0, 0, innerAreaW, innerAreaH);
    gradeGrad.addColorStop(0, 'rgba(0, 240, 255, 0.2)');
    gradeGrad.addColorStop(1, 'rgba(255, 0, 128, 0.25)');
    ctx.fillStyle = gradeGrad;
    ctx.fillRect(0, 0, innerAreaW, innerAreaH);
  } else if (grade === 'Vice') {
    const gradeGrad = ctx.createLinearGradient(0, 0, innerAreaW, innerAreaH);
    gradeGrad.addColorStop(0, 'rgba(128, 0, 255, 0.25)');
    gradeGrad.addColorStop(1, 'rgba(255, 0, 128, 0.2)');
    ctx.fillStyle = gradeGrad;
    ctx.fillRect(0, 0, innerAreaW, innerAreaH);
  } else if (grade === 'Noir') {
    ctx.fillStyle = 'rgba(40, 40, 50, 0.45)';
    ctx.fillRect(0, 0, innerAreaW, innerAreaH);
  }
  ctx.restore();

  // 3. Film grain and dark vignette
  if (state.grain) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, innerAreaW, innerAreaH);
    ctx.clip();
    const numDots = Math.floor((innerAreaW * innerAreaH) / 150);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    for (let i = 0; i < numDots; i++) {
      const gx = Math.random() * innerAreaW;
      const gy = Math.random() * innerAreaH;
      ctx.fillRect(gx, gy, 1, 1);
    }
    ctx.restore();
  }

  if (state.vignette) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, innerAreaW, innerAreaH);
    ctx.clip();
    const vig = ctx.createRadialGradient(
      innerAreaW / 2, innerAreaH / 2, Math.min(innerAreaW, innerAreaH) * 0.3,
      innerAreaW / 2, innerAreaH / 2, Math.max(innerAreaW, innerAreaH) * 0.75
    );
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, innerAreaW, innerAreaH);
    ctx.restore();
  }

  // 4. Draw small gold-ringed circular stamp reading 2026 in top-left corner of panel area
  ctx.save();
  const stampX = 32;
  const stampY = 32;
  const stampR = 20;

  ctx.beginPath();
  ctx.arc(stampX, stampY, stampR, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 10, 20, 0.85)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffd700';
  ctx.stroke();

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('2026', stampX, stampY);
  ctx.restore();

  // Restore from inner area translation/clip
  ctx.restore();

  // 5. Thin pink border frame inset by a small margin (around the whole cover)
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ff2288';
  ctx.strokeRect(frameX, frameY, frameW, frameH);
  ctx.restore();

  // 6. Caption block at the bottom
  // Reserved height is captionH, positioned at the bottom inside frame
  const captionTopY = frameY + frameH - captionH;
  const captionX = frameX + 16;
  const captionW = frameW - 32;

  ctx.save();
  ctx.translate(captionX, captionTopY);

  const subtitle = state.subtitle || 'NEON SUNSET • 2026';
  const title = state.title || 'SUNSET HEIST';
  const titleColor = state.titleColor || '#ffd700';
  const titleSizeMult = typeof state.titleSize === 'number' ? state.titleSize : 1;

  // Subtitle: Bebas Neue, gold, letterspaced, thin dark outline
  const subFontSize = Math.max(12, Math.round(captionH * 0.22));
  ctx.font = `${subFontSize}px "Bebas Neue", Impact, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Letterspacing simulation or native if supported
  let subX = 0;
  const subY = 4;
  const subLetterSpacing = 3;
  
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#0a0510';
  ctx.fillStyle = '#ffd700';

  for (let i = 0; i < subtitle.length; i++) {
    const char = subtitle[i];
    ctx.strokeText(char, subX, subY);
    ctx.fillText(char, subX, subY);
    subX += ctx.measureText(char).width + subLetterSpacing;
  }

  // Thin gold rule beneath subtitle
  const ruleY = subY + subFontSize + 6;
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffd700';
  ctx.beginPath();
  ctx.moveTo(0, ruleY);
  ctx.lineTo(captionW, ruleY);
  ctx.stroke();
  ctx.restore();

  // Main title below the rule in heavy condensed font Anton in uppercase
  // Size from reserved caption height, shrink only if wider than most of cover width
  let titleFontSize = Math.round((captionH - ruleY - 8) * 1.15 * titleSizeMult);
  titleFontSize = Math.max(20, Math.min(titleFontSize, captionH * 0.75));

  const uppercaseTitle = title.toUpperCase();
  ctx.font = `900 ${titleFontSize}px "Anton", Impact, sans-serif`;

  let titleWidth = ctx.measureText(uppercaseTitle).width;
  const maxTitleWidth = frameW * 0.95;
  if (titleWidth > maxTitleWidth) {
    titleFontSize = Math.round(titleFontSize * (maxTitleWidth / titleWidth));
    ctx.font = `900 ${titleFontSize}px "Anton", Impact, sans-serif`;
  }

  const titleY = ruleY + 8;

  // Magenta drop shadow
  ctx.save();
  ctx.shadowColor = '#ff007f';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;

  // Dark outline
  ctx.lineWidth = Math.max(3, Math.round(titleFontSize * 0.08));
  ctx.strokeStyle = '#050208';
  ctx.strokeText(uppercaseTitle, 0, titleY);

  ctx.fillStyle = titleColor;
  ctx.fillText(uppercaseTitle, 0, titleY);
  ctx.restore();

  ctx.restore();
}
