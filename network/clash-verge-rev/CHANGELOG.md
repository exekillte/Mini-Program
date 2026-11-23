## 2026-11-24.1 — 成人网站国家粘性分流与 GitHub 下载链路补全

### Changed
- 新增 🔞 成人网站独立顶层选择器，收录 96 个成人视频、创作者/直播、图片图库、漫画动画、成人音频/ASMR 域名及已确认的媒体 CDN。
- 按机场实际节点生成国家专属 URLTest 子组；每个子组只测试同一国家节点，不跨国择优。
- 成人国家池统一使用 Cloudflare generate_204，预期 HTTP 204；60 秒间隔、5000ms 超时、150ms 容差、max-failed-times:1、lazy:false。
- 所有国家池持续健康检查，即使当前未选中也刷新节点状态；顶层默认进入识别节点数量最多的国家池，数量相同时按日本、香港、台湾、新加坡、美国等顺序。
- 新增 🖐 成人手动子组，保留所有非中国节点，包括地区无法识别的节点。
- 跨国家切换保留手动控制，不使用嵌套 Fallback。Mihomo [#2588](https://github.com/MetaCubeX/mihomo/issues/2588) 仍报告嵌套组健康状态可能误判，导致 Fallback 提前跳过有可用子节点的国家组。
- 补齐 GitHub 三个 S3 下载域名：Release asset、repository file、user asset；统一进入 🐙 GitHub。

### Rationale
- R34 使用 Cloudflare 挑战机制，自动跨国择优会改变出口地区并增加重新验证概率。国家内 URLTest 可以在当前国家中换用其他健康节点；跨国家只在当前国家节点全部失效后由用户决定。
- Cloudflare 官方说明挑战可由 IP 声誉、历史风险评分和 Bot 检测触发；国家一致不能保证同一国家不同 IP 都免挑战。
- Cloudflare generate_204 只测试通用 Cloudflare 网络连通性，不代表目标成人站点对该 IP 的信誉判断或挑战结果。
- 96 个域名按成人视频、创作者/直播、图片图库、漫画动画和音频 ASMR 分类；不把 Reddit、X、Pixiv 等混合平台整站纳入。

### Validation
- JavaScript 在 V8 中编译通过。
- 模拟内联订阅验证：成人顶层选择器、按国家隔离的 URLTest、最大节点池默认选择、全部国家池 lazy:false、手动池保留地区未知节点。
- 验证成人域名规则位于 GEOSITE/GEOIP 国内兜底和国际默认规则之前。
- 验证三个 GitHub S3 域名使用正确的 JavaScript 规则格式，并进入 GitHub 专用策略组。
- 验证原始机场 proxies 节点数组未被修改。
- 尚未在用户真实机场订阅上验证全部 96 个站点，也未实测 R34 的 Cloudflare 信誉/挑战结果和长时间媒体播放；应用后仍需实机验收。

### References
- [Mihomo proxy groups: URLTest](https://wiki.metacubex.one/config/proxy-groups/url-test/)
- [Mihomo issue #2588: nested group health-check behavior](https://github.com/MetaCubeX/mihomo/issues/2588)
- [Cloudflare Challenge troubleshooting](https://developers.cloudflare.com/cloudflare-challenges/troubleshooting/)
- [GitHub S3 asset hosts](https://github.com/ineo6/hosts/blob/master/hosts)
- [Adult video platform overview](https://en.wikipedia.org/wiki/List_of_online_video_platforms)
- [Adult live cam directory](https://wheretoporn.com/cams)
- [Adult ASMR platform review](https://nightanalytics.com/erotic-audio-stories/best-adult-asmr-sites/)

## 2026-11-22.1 — GitHub 专用自动分流与 Bilibili 港澳台手动切换

### Changed
- 新增 `🐙 GitHub` 顶层策略组和 `♻️ GitHub自动` URLTest 子组，默认自动择优；同时保留非中国节点手动选择。
- GitHub 自动健康检查使用 `https://github.com/`，预期 HTTP 200；60 秒间隔、5000ms 超时、100ms 容差、`max-failed-times: 1`、`lazy: true`。
- GitHub 网页、REST API、Raw/Objects/Release、GitHub Assets、Pages、Codespaces 相关域名统一走 GitHub 策略组。
- 新增 `📺 哔哩哔哩` 手动选择组，默认 `DIRECT`；仅提供机场实际存在且名称可识别的香港、澳门、台湾节点，不做自动测速或自动切换。
- 将 Bilibili 主站、API、图片、视频 CDN、短链及国际站域名规则置于 `GEOSITE,cn` / `GEOIP,CN` 之前，确保规则模式下手动选择港澳台出口生效。
- 新增澳门地区节点识别；不把整个共享 `akamaized.net` / `smtcdns.net` CDN 域名整体纳入 Bilibili 代理。
- 保留 GPT、Google、国际默认及其他业务组的既有探测参数和路由逻辑。

### Rationale
- GitHub 首页测速只能验证基础 HTTP 可达性，因此专用组覆盖常见 GitHub 页面/API/内容域名，避免资源子域名落入不同出口；实际 Git smart HTTP、SSH、API 认证和 LFS 仍需实机验收。
- Bilibili 的港澳台内容选择需要在规则模式下明确命中一个可手动控制的选择器。将默认值设为 `DIRECT`，既保持日常国内直连，又允许用户手动指定港澳台出口。
- Bilibili 规则必须位于通用中国域名/IP 规则之前，否则会被国内直连兜底提前匹配。

### Validation
- 新增 Node.js 内置模块 smoke test：验证脚本生成、GitHub 自动组与域名分流、Bilibili 默认 DIRECT 与港澳台手动节点范围、规则优先级及原始代理节点不变。
- JavaScript 语法检查和模拟订阅检查通过后再发布。
- 未在用户真实机场订阅上实测所有 GitHub 下载链路及 Bilibili 港澳台番剧播放；需用户应用后验收。

## 2026-11-19.1 — 全业务自动健康检查同步

### Changed
- 保留 GPT 自动 URLTest、GPT Fallback 备用和 GPT 手动子组，不改变 GPT 候选地区顺序。
- Google 自动组：60 秒检测、5000ms 超时、100ms 容差、`max-failed-times: 1`、`lazy: true`；健康检查仍使用 Google `generate_204`，要求 HTTP 204。
- 国际默认自动组：60 秒检测、5000ms 超时、100ms 容差、`max-failed-times: 1`、`lazy: true`；继续使用 gstatic `generate_204`。
- TikTok 与 OneDrive 自动组：90 秒检测、5000ms 超时、80ms 容差、`max-failed-times: 1`。
- 俄站与 Steam 自动组：120 秒检测、5000ms 超时、80ms 容差、`max-failed-times: 1`。
- 各业务组继续使用自己的健康检查 URL 与预期 HTTP 状态，不把 GPT 的检测地址错误复用到其他业务。
- 不为其他业务组增加 Fallback；Fallback 只按顺序选择首个健康节点，不比较延迟。
- 国内直连、国际默认兜底分流规则、业务域名映射及节点地区池保持不变。

### Rationale
- `2026-11-18.1` 只为 GPT 设置了 60 秒周期、2500ms 超时和 `max-failed-times: 1`；Google 等其他自动组仍使用 180 秒周期、8000ms 超时、40ms 容差和默认失败阈值 5。
- Mihomo 文档说明 URLTest 按探测 URL 结果选择低延迟节点；`lazy` 控制未选中组是否检测，`max-failed-times` 控制触发主动健康检查的失败阈值。
- Clash Verge Rev #8531 报告手动测速可能忽略 `expected-status` 并覆盖 URLTest 健康状态；#8646 报告前端可能显示陈旧测速缓存。因此客户端单节点绿色数字不一定与业务组的健康检查结果可直接比较。
- 采用更短间隔和更低失败阈值，但保留各业务自己的探测目标，避免用一个通用 URL 误判特定服务可用性。

### Validation
- JavaScript 在 V8 中编译通过。
- 使用模拟内联订阅验证配置生成成功、八个顶层业务组存在、GPT 默认自动组不变。
- 验证 Google、TikTok、俄站、OneDrive、Steam、国际默认自动组的 URL、状态码、间隔、超时、容差和失败阈值。
- 验证国内直连规则与国际默认 MATCH 兜底仍存在。
- 未在用户真实订阅上完成实机验证；Google 自动组是否能从当前 Timeout 节点切换到其他节点，仍需在应用后观察内核健康状态和真实访问结果。

## 2026-11-18.1 — GPT 双自动策略与手动隔离

### Changed
- GPT 默认自动组从 Fallback 调整为 URLTest，探测目标改为 `https://chatgpt.com/`，要求 HTTP 200。
- GPT URLTest：60 秒周期、2500ms 超时、100ms 容差、`max-failed-times: 1`、`lazy: false`。
- 新增 GPT Fallback 备用组：30 秒周期、2500ms 超时、`max-failed-times: 1`、`lazy: true`。
- GPT Fallback 候选优先顺序调整为美国 → 新加坡 → 台湾 → 日本 → 韩国 → 英国。
- 新增独立 GPT 手动选择子组；顶层 ChatGPT 选择器只提供 GPT 自动、GPT 故障转移、GPT 手动三个入口，避免单节点选项绕过自动组。
- 为 `ws.chatgpt.com` 增加显式 ChatGPT 分流规则。
- 其他业务组及国内/国际分流规则保持不变。

### Rationale
- 旧版 Fallback 只按固定顺序选择首个健康节点，不比较探测延迟；若首选节点的 HTTP 探测成功但长连接不稳定，它仍可能继续被选中。
- 当前 URLTest 直接使用扩展筛选出的内联节点列表，不使用 `proxy-providers` / `include-all` 路径；Mihomo #3337 的复现配置使用 provider 刷新路径，不能简单等同于本脚本的内联候选列表。
- 不采用嵌套 Fallback / 地区 URLTest 结构，规避 Mihomo #2588 所报告的嵌套组健康状态问题。
- GPT 主页 HTTP 探测仍只是应用层可达性近似指标，不能验证用户会话下的 SSE/WebSocket 长连接，也不能迁移已有连接。

### Validation
- JavaScript 在 V8 中编译并执行通过。
- 使用模拟内联订阅验证 GPT 顶层默认选择为 `♻️ GPT自动`。
- 验证 GPT 自动组为 URLTest、故障转移组为 Fallback、手动节点被隔离在 `🖐 GPT手动` 子组。
- 验证顶层 ChatGPT 选择器不再直接暴露单个节点，避免绕过自动组。
- 验证 `ws.chatgpt.com` 明确命中 ChatGPT 规则。
- 尚未在用户真实订阅和实际长时间模型流式会话中完成实机稳定性验收。

# Changelog

## 2026-11-16.1 — GPT Fallback 故障转移

### Changed
- GPT 自动组从 `url-test` 改为 `fallback`，避免依赖 URLTest 的 `fastNode` 缓存择优路径。
- Fallback 按日本、美国、新加坡、台湾、韩国、英国的顺序，选择第一个通过 GPT 专用健康检查的节点。
- GPT 健康检查地址保留 `https://chatgpt.com/api/auth/providers`，预期状态为 HTTP 200。
- 检测间隔调整为 60 秒，超时调整为 3000ms，`lazy: false`。
- GPT 组保留 `max-failed-times: 2`，即两次实际连接失败后触发主动健康检查。
- 修正通用组的失败阈值：不再为所有其他业务组强制写入 2，交由 Mihomo 使用默认值。
- 其他业务组仍维持 URLTest、180 秒检测间隔、40ms 容差和原有分流规则。

### Rationale
- Mihomo 社区报告 URLTest 可能因内部 `fastNode` 旧实例、候选列表识别和容差逻辑问题而停留在失效节点。
- Fallback 不使用同一最优节点缓存，而是按当前健康状态顺序寻找第一个可用节点。
- Clash Verge Rev 手动测速另有已报告问题：可能忽略 `expected-status` 并覆盖同 URL 健康状态，因此文档明确要求使用自动健康检查验证。

### Validation
- 完整 JavaScript 在 V8 环境中编译并执行通过。
- 使用模拟订阅验证 GPT 组为 Fallback、参数正确、候选顺序正确、父级选择器仍指向自动组。
- 模拟日本节点不健康、美国节点健康时，按 Fallback 逻辑选择美国。
- 验证其他业务组仍保持 URLTest，国内直连和最终 MATCH 规则未改变。
- 尚未在用户真实机场订阅与 Clash Verge Rev 客户端中完成实机验证。

## 2026-11-13.2 — GPT 专用探测与持续测速
- GPT 自动组改用 ChatGPT 认证提供商入口作为探测目标。
- 设置 `lazy: false`、90 秒检测间隔、5000ms 超时和 30ms 容差。
- GPT 自动候选顺序为日本、美国、新加坡、台湾、韩国、英国。
- 尚未完成真实订阅实机验证。

## 2026-11-13 — URLTest 自动择优修订
- ChatGPT、Google、OneDrive 从 Fallback 改为 URLTest。
- 业务组统一使用 180 秒检测间隔、40ms 容差和 8000ms 检测超时。
- ChatGPT 自动候选增加台湾地区。

## 2026-11-08 — Initial GitHub archive
- 首次纳入 GitHub 源码库。
- 新增真实代理节点筛选与地区候选池。
- 增加业务分流、安装说明、回滚说明和已知限制。
