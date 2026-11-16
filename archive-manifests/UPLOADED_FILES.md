# Uploaded Files Manifest

Repository: `exekillte/Mini-Program`  
Branch: `main`

## Clash Verge Rev / FlClash 智能分流配置

Latest script version: `2026-11-16.1`  
Status: `testing` — JavaScript compilation, mock-config generation and fallback failover simulation passed; user has completed the Android FlClash script import and subscription-binding workflow. Real-world service stability remains subject to ongoing use and node conditions.

| Path | Purpose |
|---|---|
| `network/README.md` | Network tools directory and cross-platform routing index |
| `network/clash-verge-rev/clash-verge-rev-extension.js` | Shared routing script source |
| `network/clash-verge-rev/README.md` | Desktop installation, behavior, limitations and rollback |
| `network/clash-verge-rev/CHANGELOG.md` | Script version and validation history |
| `network/flclash-android/README.md` | Android FlClash script creation, subscription binding, apply, verification and rollback workflow |
| `README.md` | Repository entry point and workflow links |
| `catalog.json` | Machine-readable program catalog, including Android guide path |

### Version 2026-11-16.1

- GPT auto group changed from URLTest to Fallback to avoid URLTest fastNode cache selection.
- Candidate order: Japan → United States → Singapore → Taiwan → South Korea → United Kingdom.
- GPT health-check URL: `https://chatgpt.com/api/auth/providers`, expected HTTP 200.
- GPT Fallback: `lazy: false`, 60-second interval, 3000ms timeout, `max-failed-times: 2`.
- Other service groups retain their previous URLTest behavior and routing rules.
- Manual delay-test caveat documented due to Clash Verge Rev issue #8531.

### Android workflow added

- Added `network/flclash-android/README.md` with the FlClash Android workflow that was successfully completed in this conversation.
- Documented JavaScript script creation, full-source replacement, binding the script under the active subscription's Override settings, preview/apply, rule-mode selection, expected policy groups, acceptance tests and rollback.
- Android FlClash and desktop Clash Verge Rev share the same routing script; client-specific setup steps are documented separately.
- No airport subscription URL, account credential, token or personal node configuration was archived.

The original script source path was updated in place. Git commit history retains prior revisions; no duplicate `final2` file was created.
