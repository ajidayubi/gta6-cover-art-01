// gta6-cover-art-01: app/src/cover.js

export function computePanelRects(layout, width, height) {
  // Margin and bottom caption reservation (22% of height)
  const margin = 16;
  const bottomReserved = height * 0.22;
  const innerWidth = width - margin * 2;
  const innerHeight = height - margin * 2 - bottomReserved;
  const startX = margin;
  const startY = margin;
  const gap = 10;

  const rects = [];

  if (layout === 'Vice Trio') {
    // Left hero panel: ~58% of inner width
    const leftW = Math.round(innerWidth * 0.58 - gap / 2);
    const rightW = innerWidth - leftW - gap;
    const rightH = Math.round((innerHeight - gap) / 2);

    rects.push({ x: startX, y: startY, w: leftW, h: innerHeight });
    rects.push({ x: startX + leftW + gap, y: startY, w: rightW, h: rightH });
    rects.push({ x: startX + leftW + gap, y: startY + rightH + gap, w: rightW, h: innerHeight - rightH - gap });
  } else if (layout === 'Four Corners') {
    // 2x2 grid
    const w = Math.round((innerWidth - gap) / 2);
    const h = Math.round((innerHeight - gap) / 2);
    rects.push({ x: startX, y: startY, w, h });
    rects.push({ x: startX + w + gap, y: startY, w: innerWidth - w - gap, h });
    rects.push({ x: startX, y: startY + h + gap, w, h: innerHeight - h - gap });
    rects.push({ x: startX + w + gap, y: startY + h + gap, w: innerWidth - w - gap, h: innerHeight - h - gap });
  } else if (layout === 'Hero Strip') {
    // Wide hero on top (~55% of inner height), two panels below side-by-side
    const topH = Math.round(innerHeight * 0.55 - gap / 2);
    const bottomH = innerHeight - topH - gap;
    const bottomW = Math.round((innerWidth - gap) / 2);

    rects.push({ x: startX, y: startY, w: innerWidth, h: topH });
    rects.push({ x: startX, y: startY + topH + gap, w: bottomW, h: bottomH });
    rects.push({ x: startX + bottomW + gap, y: startY + topH + gap, w: innerWidth - bottomW - gap, h: bottomH });
  } else {
    // Single panel covering the inner area
    rects.push({ x: startX, y: startY, w: innerWidth, h: innerHeight });
  }

  return rects;
}

export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width || 800;
  const height = canvas.height || 1000;

  const {
    layout = 'Vice Trio',
    panels = [],
    grade = 'Sunset',
    title = 'VICE CITY',
    subtitle = 'GRAND THEFT AUTO',
    titleSize = 1,
    titleColor = '#ffffff',
    grain = true,
    vignette = true
  } = state || {};

  // 1. Paint canvas background very dark
  ctx.fillStyle = '#0a0812';
  ctx.fillRect(0, 0, width, height);

  // 2. Draw a thin pink border frame inset by a small margin
  const margin = 16;
  ctx.strokeStyle = '#ff2a85';
  ctx.lineWidth = 2;
  ctx.strokeRect(margin / 2, margin / 2, width - margin, height - margin);

  // 3. Compute panel rectangles (reserving bottom 22% for caption block)
  const bottomReserved = height * 0.22;
  const innerHeight = height - margin * 2 - bottomReserved;
  const panelRects = computePanelRects(layout, width, height);

  // Fallback photo acquisition helper
  // Find first available valid photo in panels array
  let fallbackPhoto = null;
  for (let p of panels) {
    if (p && p.complete && p.naturalWidth > 0) {
      fallbackPhoto = p;
      break;
    }
  }

  // Draw panels
  panelRects.forEach((rect, index) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();

    // Get panel data
    const panel = panels[index] || {};
    let photo = panel.photo;
    const isValidPhoto = photo && photo.complete && photo.naturalWidth > 0;
    const usePhoto = isValidPhoto ? photo : fallbackPhoto;

    if (usePhoto && usePhoto.complete && usePhoto.naturalWidth > 0) {
      // Draw photo honouring zoom, pan, fit mode
      const zoom = typeof panel.zoom === 'number' ? panel.zoom : 1;
      const panX = typeof panel.panX === 'number' ? panel.panX : 0;
      const panY = typeof panel.panY === 'number' ? panel.panY : 0;
      const fit = panel.fit === 'fit' ? 'fit' : 'cover';

      const imgW = usePhoto.naturalWidth;
      const imgH = usePhoto.naturalHeight;

      let drawW, drawH, drawX, drawY;

      if (fit === 'cover') {
        const scale = Math.max(rect.w / imgW, rect.h / imgH) * zoom;
        drawW = imgW * scale;
        drawH = imgH * scale;
        drawX = rect.x + (rect.w - drawW) / 2 + panX;
        drawY = rect.y + (rect.h - drawH) / 2 + panY;
      } else {
        const scale = Math.min(rect.w / imgW, rect.h / imgH) * zoom;
        drawW = imgW * scale;
        drawH = imgH * scale;
        drawX = rect.x + (rect.w - drawW) / 2 + panX;
        drawY = rect.y + (rect.h - drawH) / 2 + panY;
      }

      ctx.drawImage(usePhoto, drawX, drawY, drawW, drawH);
    } else {
      // Sunset gradient with a palm silhouette when no photo exists at all
      const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
      grad.addColorStop(0, '#ff4e50');
      grad.addColorStop(0.5, '#f9d423');
      grad.addColorStop(1, '#2b1055');
      ctx.fillStyle = grad;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

      // Simple palm tree silhouette fallback
      ctx.fillStyle = '#0f051d';
      const trunkX = rect.x + rect.w * 0.7;
      const trunkBottom = rect.y + rect.h;
      const trunkTop = rect.y + rect.h * 0.4;
      ctx.beginPath();
      ctx.moveTo(trunkX - 4, trunkBottom);
      ctx.quadraticCurveTo(trunkX + 10, (trunkBottom + trunkTop) / 2, trunkX, trunkTop);
      ctx.lineTo(trunkX + 4, trunkTop);
      ctx.quadraticCurveTo(trunkX + 14, (trunkBottom + trunkTop) / 2, trunkX + 8, trunkBottom);
      ctx.fill();

      // Fronds
      ctx.beginPath();
      ctx.arc(trunkX, trunkTop, Math.min(rect.w, rect.h) * 0.25, Math.PI, 2 * Math.PI);
      ctx.fill();
    }

    ctx.restore();

    // Panel border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  // 4. Apply chosen colour grade as a translucent overlay over the panel area
  const panelAreaX = margin;
  const panelAreaY = margin;
  const panelAreaW = width - margin * 2;
  const panelAreaH = innerHeight;

  ctx.save();
  ctx.beginPath();
  ctx.rect(panelAreaX, panelAreaY, panelAreaW, panelAreaH);
  ctx.clip();

  if (grade === 'Sunset') {
    const overlayGrad = ctx.createLinearGradient(panelAreaX, panelAreaY, panelAreaX, panelAreaY + panelAreaH);
    overlayGrad.addColorStop(0, 'rgba(255, 120, 50, 0.25)');
    overlayGrad.addColorStop(1, 'rgba(200, 30, 100, 0.3)');
    ctx.fillStyle = overlayGrad;
    ctx.fillRect(panelAreaX, panelAreaY, panelAreaW, panelAreaH);
  } else if (grade === 'Neon') {
    const overlayGrad = ctx.createLinearGradient(panelAreaX, panelAreaY, panelAreaX + panelAreaW, panelAreaY + panelAreaH);
    overlayGrad.addColorStop(0, 'rgba(0, 240, 255, 0.2)');
    overlayGrad.addColorStop(1, 'rgba(255, 0, 128, 0.25)');
    ctx.fillStyle = overlayGrad;
    ctx.fillRect(panelAreaX, panelAreaY, panelAreaW, panelAreaH);
  } else if (grade === 'Vice') {
    ctx.fillStyle = 'rgba(110, 20, 180, 0.25)';
    ctx.fillRect(panelAreaX, panelAreaY, panelAreaW, panelAreaH);
  } else if (grade === 'Noir') {
    ctx.fillStyle = 'rgba(40, 40, 45, 0.4)';
    ctx.fillRect(panelAreaX, panelAreaY, panelAreaW, panelAreaH);
  }
  ctx.restore();

  // 5. Add film grain as scattered faint dots and dark vignette at the edges when those options are on
  if (grain) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    const dotCount = Math.floor((panelAreaW * panelAreaH) / 300);
    for (let i = 0; i < dotCount; i++) {
      const gx = panelAreaX + Math.random() * panelAreaW;
      const gy = panelAreaY + Math.random() * panelAreaH;
      ctx.fillRect(gx, gy, 1, 1);
    }
    ctx.restore();
  }

  if (vignette) {
    ctx.save();
    const vigGrad = ctx.createRadialGradient(
      width / 2, (margin + innerHeight) / 2, Math.max(panelAreaW, panelAreaH) * 0.3,
      width / 2, (margin + innerHeight) / 2, Math.max(panelAreaW, panelAreaH) * 0.75
    );
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(panelAreaX, panelAreaY, panelAreaW, panelAreaH);
    ctx.restore();
  }

  // 6. Draw a small gold-ringed circular stamp reading 2026 in the top-left corner of the panel area
  ctx.save();
  const stampX = panelAreaX + 28;
  const stampY = panelAreaY + 28;
  const stampRadius = 20;

  ctx.beginPath();
  ctx.arc(stampX, stampY, stampRadius, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(10, 8, 18, 0.85)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffd700';
  ctx.stroke();

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('2026', stampX, stampY);
  ctx.restore();

  // 7. Finish with the caption block in the reserved bottom 22% height
  const captionTop = margin * 2 + innerHeight;
  const captionH = bottomReserved;
  const captionCenterX = width / 2;

  ctx.save();

  // Subtitle: tall narrow gold letterspaced font with thin dark outline
  const subFontSize = Math.max(10, Math.round(captionH * 0.18));
  ctx.font = `bold ${subFontSize}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = '6px';
  }

  const subY = captionTop + captionH * 0.08;
  const subText = subtitle ? subtitle.toUpperCase() : '';

  ctx.lineWidth = 2;
  ctx.strokeStyle = '#000000';
  ctx.strokeText(subText, captionCenterX, subY);
  ctx.fillStyle = '#ffd700';
  ctx.fillText(subText, captionCenterX, subY);

  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = '0px';
  }

  // Thin gold rule beneath subtitle
  const ruleY = subY + subFontSize + 8;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#ffd700';
  ctx.beginPath();
  ctx.moveTo(width * 0.25, ruleY);
  ctx.lineTo(width * 0.75, ruleY);
  ctx.stroke();

  // Main title: heavy condensed uppercase font in chosen colour with dark outline and magenta drop shadow
  let titleFontSize = Math.round(captionH * 0.48 * (typeof titleSize === 'number' ? titleSize : 1));
  const titleText = title ? title.toUpperCase() : '';

  ctx.font = `900 ${titleFontSize}px Anton, sans-serif`;
  
  const maxTitleWidth = width * 0.9;
  let textMetrics = ctx.measureText(titleText);
  if (textMetrics.width > maxTitleWidth) {
    titleFontSize = Math.floor(titleFontSize * (maxTitleWidth / textMetrics.width));
    ctx.font = `900 ${titleFontSize}px Anton, sans-serif`;
    textMetrics = ctx.measureText(titleText);
  }

  const titleY = ruleY + 12;

  ctx.save();
  ctx.shadowColor = '#ff2a85';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;

  ctx.lineWidth = Math.max(3, Math.round(titleFontSize * 0.08));
  ctx.strokeStyle = '#0a0812';
  ctx.strokeText(titleText, captionCenterX, titleY);

  ctx.fillStyle = titleColor || '#ffffff';
  ctx.fillText(titleText, captionCenterX, titleY);
  ctx.restore();

  ctx.restore();
}
