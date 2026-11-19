export async function runShot(shotName, query, loader) {
  const title = query.title !== undefined ? query.title : 'SUNSET HEIST';
  const subtitle = query.subtitle !== undefined ? query.subtitle : 'NEON SUNSET • 2026';
  const layout = query.layout !== undefined ? query.layout : 'Vice Trio';
  const grade = query.grade !== undefined ? query.grade : 'Sunset';

  if (shotName === 'cover') {
    document.body.classList.add('shot-cover');
  }

  const photos = ['neon-street', 'pier-dusk', 'boulevard', 'skyline-night'];
  for (const photo of photos) {
    await loader(photo, title, subtitle, layout, grade);
  }

  await new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });

  window.__shotReady = true;
}
