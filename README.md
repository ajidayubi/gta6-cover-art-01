# Vice Cover Maker

[![make.fun bounty: gta6-cover-art-01](https://badge.make.fun/bounty/gta6-cover-art-01?style=flat)](https://make.fun/bounties/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Leaderboard rank](https://badge.make.fun/bounty/gta6-cover-art-01/rank?style=flat)](https://make.fun/bounties/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Bounty reward](https://badge.make.fun/bounty/gta6-cover-art-01/reward?style=flat)](https://make.fun/bounties/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Cover Maker is a make.fun bounty entry for the competition gta6-cover-art-01. The app turns your own photos and a caption into a striking multi-panel poster cover with sunset and neon colour grades, exports it as a PNG in three post sizes (1080 by 1080, 1080 by 1350, 1920 by 1080), and runs fully offline in a desktop browser so your photos never leave your machine.

## Run it

Serve the app and open localhost on port 8080:

```bash
node serve.ts
```

Build the submission dossier by making an out directory and running `node main.ts` with the `MAKEFUN_OUTPUT_DIR` environment variable set to `out`:

```bash
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts
```
