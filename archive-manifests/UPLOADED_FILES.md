# Uploaded Files Manifest

Repository: `exekillte/Mini-Program`  
Branch: `main`

## Clash Verge Rev 智能分流扩展

Latest version: `2026-11-16.1`  
Status: `testing` — JavaScript compilation, mock-config generation and fallback failover simulation passed; real subscription validation remains pending.

| Path | Purpose |
|---|---|
| `network/README.md` | Network tools directory guide |
| `network/clash-verge-rev/clash-verge-rev-extension.js` | Current extension script |
| `network/clash-verge-rev/README.md` | Installation, behavior, limitations and rollback |
| `network/clash-verge-rev/CHANGELOG.md` | Version and validation history |
| `README.md` | Repository entry point |
| `catalog.json` | Machine-readable program catalog |

### Version 2026-11-16.1

- GPT auto group changed from URLTest to Fallback to avoid URLTest fastNode cache selection.
- Candidate order: Japan → United States → Singapore → Taiwan → South Korea → United Kingdom.
- GPT health-check URL: `https://chatgpt.com/api/auth/providers`, expected HTTP 200.
- GPT Fallback: `lazy: false`, 60-second interval, 3000ms timeout, `max-failed-times: 2`.
- Other service groups retain their previous URLTest behavior and routing rules.
- Manual delay-test caveat documented due to Clash Verge Rev issue #8531.

The original source path was updated in place. Git commit history retains prior revisions; no duplicate `final2` file was created.
