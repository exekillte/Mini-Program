# Network

网络工具、代理客户端配置与扩展脚本的集中目录。

## 分类

- `clash-verge-rev/`：Clash Verge Rev 的订阅扩展脚本及其使用说明。
- `flclash-android/`：Android 版 FlClash 的脚本导入、订阅绑定、应用与验收流程。

## 当前网络分流方案

电脑端 Clash Verge Rev 与 Android 端 FlClash 共用同一份 JavaScript 分流脚本，避免两端的业务规则长期分叉。

- **当前脚本版本：** `2026-11-24.1`
- **统一脚本源码：** [clash-verge-rev-extension.js](clash-verge-rev/clash-verge-rev-extension.js)
- **桌面端使用说明：** [Clash Verge Rev 智能分流扩展](clash-verge-rev/README.md)
- **安卓端操作流程：** [FlClash Android 网络分流配置流程](flclash-android/README.md)
- **GitHub：** 专用 URLTest 自动择优，网页/API/Raw/Release 相关域名统一分流。
- **Bilibili：** 独立手动选择器，默认 DIRECT；手动选港澳台节点后在规则模式下强制代理。
- **成人网站：** 81 个成人内容域名统一分流；国家内 URLTest 自动择优，国家之间手动切换以维持 Cloudflare 地区会话。

### ChatGPT 代理组

顶层 ChatGPT 选择器现在只提供三个入口：

1. `♻️ GPT自动`：URLTest，按 ChatGPT 主页探测延迟择优，默认策略。
2. `🛟 GPT故障转移`：Fallback，按美国 → 新加坡 → 台湾 → 日本 → 韩国 → 英国的顺序选择首个健康节点。
3. `🖐 GPT手动`：人工选择具体节点。

应用后应确认顶层 ChatGPT 组实际选择的是 `♻️ GPT自动`。主页 HTTP 探测不能验证模型 SSE/WebSocket 长连接，也不能迁移已经建立的旧连接；详细限制与验收方法见桌面端指南。

### 其他业务自动组

GitHub、Google、TikTok、俄站、OneDrive、Steam 和国际默认组均使用各自的 URLTest 健康检查目标，不再沿用旧版统一的 180 秒间隔、8000ms 超时和默认失败阈值。新版 Google 与国际默认组为 60 秒检测；TikTok 与 OneDrive 为 90 秒；俄站与 Steam 为 120 秒。各组均设置 `max-failed-times: 1`，并保留各自业务目标的预期 HTTP 状态。

不为这些组增加固定顺序的 Fallback：Fallback 不是最低延迟择优。Clash Verge Rev 的手动测速与 UI 缓存存在公开问题，单节点绿色延迟不能替代业务组健康检查结果；详见桌面端指南。

Bilibili 选择器默认 DIRECT，只有手动选择港澳台节点才会代理；规则已置于 GEOSITE/CN 与 GEOIP/CN 之前。

成人网站组使用按国家拆分的 URLTest 子组，每个国家只在本国节点内自动择优，所有国家池均持续健康检查（lazy:false）。跨国家切换保留手动控制，避免自动切换导致 Cloudflare 地区挑战；当当前国家全部节点失效时，再由用户切换到其他国家。默认国家按识别到的节点数量最多者确定。

### 成人网站策略组

- 顶层：🔞 成人网站，默认进入识别节点数量最多的国家自动组。
- 子组：♻️ 成人日本自动、♻️ 成人香港自动等，只在同一国家内 URLTest；机场未提供该国家节点时不生成对应组。
- 健康检查：Cloudflare generate_204，HTTP 204；60 秒间隔、5000ms 超时、150ms 容差、max-failed-times:1、lazy:false。
- 🖐 成人手动保留所有非中国节点（包括无法识别地区的节点）。
- 不使用嵌套 Fallback 自动跨国：Mihomo [#2588](https://github.com/MetaCubeX/mihomo/issues/2588) 仍有嵌套组健康状态问题报告；跨国切换由用户在同国家节点全部失效后手动完成。
- Cloudflare 探测只证明通用 Cloudflare 网络可达，不证明 R34 的 IP 信誉或挑战结果。

## 维护规则

1. GitHub `main` 分支为正式源码版本。
2. 只提交通用配置逻辑和公开说明；不提交机场订阅链接、账号凭据、访问令牌或其他私人配置。
3. 每个工具独立建目录，源码与说明放在同一目录。
4. Android 与桌面端优先复用同一份规则脚本；客户端差异写入各自操作指南，不复制维护两套规则。
