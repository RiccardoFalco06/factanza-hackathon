# Team idea voting

A small tool the team used during the hackathon to collect ideas and vote on them from our phones.
Every person ticks the ideas they back; the ranking updates live for everyone.

- `index.html` + `app.js`: the page, and the voting logic (`apply`, `rank`) shared with the server.
- `server/server.js`: tiny Node backend (no dependencies) that keeps the state in `data.json` with atomic writes.
- `server/tunnel.sh`: Cloudflare quick tunnel; when its address changes it redeploys the page to Vercel with `/api` pointing to it.
- `node test.js`: ranking and merge tests.

The votes themselves are not in the repo.
