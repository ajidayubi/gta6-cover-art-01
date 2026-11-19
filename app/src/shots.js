export async function runShot(shotName, query, loader) {
  const title = query.title ? query.title : 'SUNSET HEIST';
  const subtitle = query.subtitle ? query.subtitle : 'NEON SUNSET • 2026';
  const layout = query.layout ? query.layout : 'Vice Trio';
  const grade = query.grade ? query.grade : 'Sunset';

  if (shotName === 'cover') {
    document.body.classList.add('shot-cover');
  }

  const photos = ['neon-street', 'pier-dusk', 'boulevard', 'skyline-night'];
  for (const photo of photos) {
    await loader(photo, title, subtitle, layout, grade);
  }

  await new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });

  window.__shotReady = true;
}
