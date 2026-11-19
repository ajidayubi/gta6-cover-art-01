/**
 * Shots module for screenshot mode.
 * Handles loading sample photos and setting up the state for preset screenshots.
 */

export async function runShot(shot, query, load) {
  // Query parameters or defaults
  const title = query.title || 'SUNSET HEIST';
  const subtitle = query.subtitle || 'NEON SUNSET • 2026';
  const layout = query.layout || 'Vice Trio';
  const grade = query.grade || 'Sunset';
  
  // If cover shot, hide editor chrome by adding 'shot-cover' class to body
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
  }

  // Four sample photos in fixed order
  const sampleNames = ['neon-street', 'pier-dusk', 'boulevard', 'skyline-night'];

  // Load each sample photo in turn using the loader function
  for (const name of sampleNames) {
    if (typeof load === 'function') {
      await load(name, title, subtitle, layout, grade);
    }
  }

  // Mark window ready after photos finished loading and two animation frames have passed
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.__shotReady = true;
    });
  });
}
