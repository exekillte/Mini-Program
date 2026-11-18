# Uploaded Files Manifest

Repository: `exekillte/Mini-Program`  
Branch: `main`

## Clash Verge Rev / FlClash 智能分流配置

Latest script version: `2026-11-18.1`  
Status: `testing` — JavaScript compilation and simulated inline-subscription configuration checks passed. Real airport subscription testing and long-running ChatGPT stream stability validation remain pending.

| Path | Purpose |
|---|---|
| `network/README.md` | Network tools directory and cross-platform routing index |
| `network/clash-verge-rev/clash-verge-rev-extension.js` | Shared routing script source |
| `network/clash-verge-rev/README.md` | Desktop installation, GPT strategy design, known limitations and rollback |
| `network/clash-verge-rev/CHANGELOG.md` | Script version and validation history |
| `network/flclash-android/README.md` | Android FlClash script creation, subscription binding, apply, verification and rollback workflow |
| `README.md` | Repository entry point and workflow links |
| `catalog.json` | Machine-readable program catalog, including Android guide path |

### Version 2026-11-18.1

- GPT primary automatic group changed to URLTest against `https://chatgpt.com/`, expected HTTP 200.
- GPT URLTest: 60-second interval, 2500ms timeout, 100ms tolerance, `max-failed-times: 1`, `lazy: false`.
- Added a Fallback backup group: 30-second interval, 2500ms timeout, `max-failed-times: 1`, `lazy: true`.
- Fallback candidate order: United States → Singapore → Taiwan → Japan → South Korea → United Kingdom.
- Added a dedicated GPT manual-selection subgroup.
- Top-level ChatGPT selector now exposes only GPT automatic, GPT failover, and GPT manual; direct node options no longer bypass the automatic group.
- Added an explicit `ws.chatgpt.com` routing rule.
- Other business groups and domestic/international routing remain unchanged.

### Validation and limits

- JavaScript compiled and executed in V8.
- Simulated inline subscription verified the ChatGPT parent defaults to `♻️ GPT自动`.
- Verified URLTest primary, Fallback backup, manual subgroup, and no direct-node bypass at the top-level selector.
- Verified explicit `ws.chatgpt.com` routing.
- HTTP homepage probes do not verify authenticated SSE/WebSocket stream quality and cannot migrate existing connections.
- No live test against the user's subscription or long-running model streams has been completed.

The source path was updated in place. Git commit history retains prior revisions; no duplicate `final2` file was created.
