# Uploaded Files Manifest

Repository: `exekillte/Mini-Program`  
Branch: `main`

## Clash Verge Rev / FlClash 智能分流配置

Latest script version: `2026-11-24.1`  
Status: `testing` — JavaScript compilation and simulated inline-subscription tests passed. Real airport subscription testing, R34 Cloudflare challenge behavior, and long-running media-stream stability remain pending.

| Path | Purpose |
|---|---|
| `network/README.md` | Network tools directory and cross-platform routing index |
| `network/clash-verge-rev/clash-verge-rev-extension.js` | Shared routing script source |
| `network/clash-verge-rev/README.md` | Desktop installation, GPT/GitHub/Bilibili/adult routing strategy, known limitations and rollback |
| `network/clash-verge-rev/CHANGELOG.md` | Script version and validation history |
| `network/clash-verge-rev/tests/smoke-test.js` | Node.js smoke tests for GitHub S3/Bilibili/adult routing, country isolation, rule priority and regression checks |
| `network/flclash-android/README.md` | Android FlClash script creation, subscription binding, apply, verification and rollback workflow |
| `README.md` | Repository entry point and workflow links |
| `catalog.json` | Machine-readable program catalog, including Android guide path |

### Version 2026-11-24.1

- Added the adult website selector with 96 curated domains spanning adult video/studio catalogs, creator/live platforms, image boards, manga/anime, and audio/ASMR.
- Added country-specific adult URLTest pools. Each pool only tests nodes classified into that country; all country pools use Cloudflare HTTP 204 checks and `lazy:false` to keep unselected candidates tested.
- Adult routing automatically selects only within the chosen country; cross-country changes remain manual to preserve Cloudflare region/session continuity. Added a manual pool for all non-China nodes, including unclassified nodes.
- Added the three missing GitHub S3 download hosts to the GitHub strategy group: release assets, repository files, and user assets.
- Retained the GitHub URLTest group (60-second interval, 5000ms timeout, 100ms tolerance, `max-failed-times: 1`, HTTP 200 probe) and existing GitHub domain routing.
- Retained the Bilibili selector defaulting to `DIRECT`, with manual Hong Kong, Macau, and Taiwan node choices; Bilibili rules remain before China GeoSite/GeoIP fallback.
- Expanded smoke tests for adult domains, country isolation, active health checks, rule priority, and GitHub S3 routing.

#### Source verification

| File | UTF-8 bytes | Git Blob SHA |
|---|---:|---|
| `network/clash-verge-rev/clash-verge-rev-extension.js` | 26838 | `79d42021978065b78b3848b8d0d64b162c532238` |
| `network/clash-verge-rev/tests/smoke-test.js` | 7640 | `a2e7957d032e58667e6c19980d1f3bd861c060a2` |

Validation: JavaScript syntax compilation and the inline-subscription smoke test passed. Real airport subscription testing, R34 Cloudflare challenge behavior, and long-running media-stream stability remain pending.

### Version 2026-11-19.1

- GPT primary automatic group changed to URLTest against `https://chatgpt.com/`, expected HTTP 200.
- GPT URLTest: 60-second interval, 2500ms timeout, 100ms tolerance, `max-failed-times: 1`, `lazy: false`.
- Added a Fallback backup group: 30-second interval, 2500ms timeout, `max-failed-times: 1`, `lazy: true`.
- Fallback candidate order: United States → Singapore → Taiwan → Japan → South Korea → United Kingdom.
- Added a dedicated GPT manual-selection subgroup.
- Top-level ChatGPT selector now exposes only GPT automatic, GPT failover, and GPT manual; direct node options no longer bypass the automatic group.
- Added an explicit `ws.chatgpt.com` routing rule.
- Synchronized automatic health-check policy across Google, TikTok, Russia, OneDrive, Steam, and international-default groups using service-specific probe URLs.
- Google and international-default groups: 60-second interval, 5000ms timeout, 100ms tolerance, `max-failed-times: 1`.
- TikTok and OneDrive: 90-second interval; Russia and Steam: 120-second interval; all use 5000ms timeout, 80ms tolerance, and `max-failed-times: 1`.
- Domestic direct routing, domain rules, and region candidate pools remain unchanged.

### Version 2026-11-19.1

- Kept GPT URLTest, Fallback backup, and manual subgroup unchanged.
- Updated Google, TikTok, Russia, OneDrive, Steam, and international-default URLTest groups with shorter intervals, shorter timeouts, and `max-failed-times: 1`.
- Kept each service-specific health-check URL and expected HTTP status; did not add fixed-order Fallback groups to other services.
- JavaScript compiled in V8 and generated a mock inline-subscription configuration with all eight top-level business groups.
- Verified service-specific health-check settings and that domestic direct / international default routing rules remain present.
- Live subscription validation and real-world business stability testing remain pending.

### Validation and limits

- JavaScript compiled and executed in V8.
- Simulated inline subscription verified the ChatGPT parent defaults to `♻️ GPT自动`.
- Verified URLTest primary, Fallback backup, manual subgroup, and no direct-node bypass at the top-level selector.
- Verified explicit `ws.chatgpt.com` routing.
- HTTP homepage probes do not verify authenticated SSE/WebSocket stream quality and cannot migrate existing connections.
- No live test against the user's subscription or long-running model streams has been completed.

The source path was updated in place. Git commit history retains prior revisions; no duplicate `final2` file was created.
