# Uploaded Files Manifest

Repository: `exekillte/Mini-Program`  
Branch: `main`

## Clash Verge Rev 智能分流扩展

Latest version: `2026-11-13.2`  
Status: `testing` — JavaScript compilation and mock-config execution passed; real subscription validation remains pending.

| Path | Purpose |
|---|---|
| `network/README.md` | Network tools directory guide |
| `network/clash-verge-rev/clash-verge-rev-extension.js` | Current extension script |
| `network/clash-verge-rev/README.md` | Installation, behavior, limitations and rollback |
| `network/clash-verge-rev/CHANGELOG.md` | Version and validation history |
| `README.md` | Repository entry point |
| `catalog.json` | Machine-readable program catalog |

### Version 2026-11-13.2

- GPT health-check URL: `https://chatgpt.com/api/auth/providers`, expected HTTP 200.
- GPT auto group: `lazy: false`, 90-second interval, 5000ms timeout, 30ms tolerance.
- Cold-start candidate order: Japan, United States, Singapore, Taiwan, South Korea, United Kingdom.
- Other service groups retain their previous health-check settings.

The original source path was updated in place. Git commit history retains prior revisions; no duplicate `final2` file was created.
