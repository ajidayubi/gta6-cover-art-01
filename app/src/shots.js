export async function runShot(shot, query, load) {
  const title = query.get("title") || "SUNSET HEIST";
  const names = ["neon-street", "pier-dusk", "boulevard", "skyline-night"];
  for (const name of names) {
    await load(name, title);
  }
  if (shot === "cover") {
    document.body.classList.add("shot-cover");
  }
  await new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.__shotReady = true;
        resolve();
      });
    });
  });
}
