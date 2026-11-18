# Clash Verge Rev 智能分流扩展

- 版本标识：`2026-11-18.1`
- 状态：**试运行；脚本结构与模拟配置已验证，真实机场长连接稳定性待实测**
- 类型：Clash Verge Rev / FlClash 共用的 Mihomo 订阅扩展脚本
- 入口：`main(config, profileName)`

## 文件

- `clash-verge-rev-extension.js`：扩展脚本源码。
- `README.md`：安装、策略说明、验证边界与回滚。
- `CHANGELOG.md`：版本记录。

## 本版改动

本版重点重做 ChatGPT 代理组，不改动其他业务组的节点筛选与规则分流：

1. **GPT 自动**改为 URLTest：以 ChatGPT 主页 HTTP 200 探测结果比较候选节点延迟。
2. 新增**GPT 故障转移**：Fallback 作为备用策略，按美国 → 新加坡 → 台湾 → 日本 → 韩国 → 英国顺序选择第一个健康节点。
3. 新增**GPT 手动**子组：所有人工选择的 GPT 节点集中在这里。
4. 顶层 ChatGPT 选择器只保留三个入口：GPT 自动、GPT 故障转移、GPT 手动。避免像旧版一样直接点中单个节点后，无意间绕过自动组。
5. 明确添加 `ws.chatgpt.com` 的 ChatGPT 分流规则；它原本也会被 `chatgpt.com` 后缀规则覆盖，本次增加显式规则便于核验。

## 策略组

| 顶层策略组 | 子组 | 类型 | 用途 |
|---|---|---|---|
| 💬 ChatGPT | ♻️ GPT自动 | URLTest | 默认策略，按 ChatGPT 主页探测延迟择优 |
| 💬 ChatGPT | 🛟 GPT故障转移 | Fallback | 备用策略，按地区优先顺序选择首个健康节点 |
| 💬 ChatGPT | 🖐 GPT手动 | Select | 用户手动选择单个节点 |
| 🌐 Google | ♻️ Google自动 | URLTest | Google / Gemini / YouTube |
| 📱 TikTok | ♻️ TikTok自动 | URLTest | TikTok |
| 🪆 俄站 | ♻️ 俄站自动 | URLTest | 俄罗斯站点 |
| ☁️ OneDrive | ♻️ OneDrive自动 | URLTest | OneDrive |
| 🎮 Steam | ♻️ Steam自动 | URLTest | Steam |
| 🇨🇳 国内直连 | DIRECT | Select | 国内直连 |
| 🌍 国际默认 | ♻️ 国际自动 | URLTest | 未单独分类的国际网站 |

## ChatGPT 自动组参数

### ♻️ GPT自动（默认）

| 参数 | 设置 | 作用 |
|---|---:|---|
| 类型 | `url-test` | 比较健康候选节点的探测延迟 |
| 探测地址 | `https://chatgpt.com/` | 检查 ChatGPT 主站入口 |
| 预期状态 | HTTP 200 | 排除无法正常返回主页的节点 |
| 检测间隔 | 60 秒 | 周期性刷新 |
| 检测超时 | 2500ms | 超时视为探测失败 |
| 容差 | 100ms | 小幅延迟差异不频繁换节点 |
| `max-failed-times` | 1 | 一次实际拨号失败后触发主动健康检查 |
| `lazy` | `false` | 即使该组暂未选中，也持续检测 |

这组优先解决“有多个可用节点时，不应只按固定国家顺序选取”的问题。100ms 容差用于降低小幅延迟波动造成的频繁切换；它不是稳定性评分，也不代表实际吞吐量。

### 🛟 GPT故障转移（备用）

| 参数 | 设置 |
|---|---:|
| 类型 | `fallback` |
| 探测地址 | `https://chatgpt.com/` |
| 预期状态 | HTTP 200 |
| 检测间隔 | 30 秒 |
| 检测超时 | 2500ms |
| `max-failed-times` | 1 |
| `lazy` | `true` |

候选顺序：**美国 → 新加坡 → 台湾 → 日本 → 韩国 → 英国**。

Fallback 不比较延迟，只按顺序选择第一个健康节点。它是备用策略，不是默认的最低延迟策略。若美国有多个节点，它们仍按订阅节点顺序排列，不会在 Fallback 内自动挑选该地区最低延迟的单个节点。

### 🖐 GPT手动

所有识别到的美国、新加坡、台湾、日本、韩国和英国节点集中在此组。需要临时验证某个出口时，先在顶层 ChatGPT 组选择「GPT手动」，再进入该子组选择具体节点。

## 一个重要边界：节点探测不等于流式连接监控

本脚本能做的是代理组层面的健康检查与新连接出口选择，**不能保证已经建立的 SSE / WebSocket / TCP 长连接无缝迁移**。

- URLTest / Fallback 的探测是 HTTP 请求，不是带有用户会话认证的模型生成请求。
- 本版探测 ChatGPT 主页，只能近似判断该节点访问 ChatGPT 主站的能力。
- 它不能证明 `ws.chatgpt.com` 的 WebSocket Upgrade、模型流式传输、账号状态和 Cloudflare 验证均正常。
- 节点在探测时返回 HTTP 200，仍可能在长时间传输中丢包或断开。
- 代理组切换不会把已经建立的旧连接迁移到新节点，也不会自动重放已经中断的模型响应。

相关上游资料：
- [OpenAI 网络指南：ChatGPT WebSocket 目标与长连接要求](https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps)
- [Mihomo #2223：Fallback 切换后旧连接不会自动中断或重试](https://github.com/MetaCubeX/mihomo/issues/2223)
- [Mihomo #1483：连接失败后触发健康检查前仍可能继续分配请求](https://github.com/MetaCubeX/mihomo/issues/1483)
- [Mihomo #1082：max-failed-times 与主动健康检查触发延迟](https://github.com/MetaCubeX/mihomo/issues/1082)

因此，若模型输出中途断开，自动组即使已经更换出口，也不能保证当前答案自动续传。需要让 ChatGPT 重新发起请求；若连续复现，应切换到另一个自动策略或 GPT 手动组中的已验证节点。

## 上游问题与本版取舍

1. [Mihomo #3337](https://github.com/MetaCubeX/mihomo/issues/3337) 报告 URLTest 在节点失效后不切换。其复现配置使用 `proxy-providers` / `include-all`；本扩展要求内联 `config.proxies`，并将候选节点直接写入 URLTest 的 `proxies`，不使用该问题中的 provider 刷新路径。但该 issue 仍是需要关注的上游问题，不能据此宣称 URLTest 在所有内核版本中都没有缺陷。
2. [Mihomo #2588](https://github.com/MetaCubeX/mihomo/issues/2588) 报告嵌套 Fallback 组可能把子组误判为不可用。本版不采用“Fallback 套地区 URLTest 组”的嵌套结构，两个自动组都直接使用扁平节点列表。
3. [Clash Verge Rev #8531](https://github.com/clash-verge-rev/clash-verge-rev/issues/8531) 报告手动测速可能忽略 `expected-status` 并覆盖健康状态。
4. [Clash Verge Rev #8646](https://github.com/clash-verge-rev/clash-verge-rev/issues/8646) 报告 Windows 界面可能显示过期测速缓存，与内核实际健康记录不一致。

## 安装与更新

1. 先备份当前订阅扩展脚本。
2. 打开目标订阅的「扩展脚本」。
3. 获取 [最新 Raw 源码](https://raw.githubusercontent.com/exekillte/Mini-Program/main/network/clash-verge-rev/clash-verge-rev-extension.js)，完整替换旧脚本并保存。
4. 更新订阅，检查扩展脚本日志和配置校验结果。
5. 打开代理页面，进入顶层「💬 ChatGPT」组。
6. **确认顶层实际选择的是「♻️ GPT自动」**。若仍显示单独节点或旧选择，手动切换一次。
7. 只有需要备用策略时，才选择「🛟 GPT故障转移」；手动测试单节点时选择「🖐 GPT手动」。
8. 等待至少一个 60 秒健康检查周期，再测试页面加载、账号界面、消息提交和连续流式输出。

### 验证注意事项

- 不要用客户端「手动测速全部节点」的颜色作为唯一健康依据；已报告的手动测速问题可能忽略预期 HTTP 状态并污染健康记录。
- 不要只看延迟数值。必须用真实 ChatGPT 请求验证页面、消息提交和持续输出。
- 如果输出中途断开，记录当时顶层 ChatGPT 选择的子组、实际节点、时间及是否发生切换。
- 如果要对比 URLTest 与 Fallback，请一次只选择一个策略，避免把手动节点选择误当成自动组行为。

## 其他业务组

其他业务组继续使用原有 URLTest 设置：180 秒检测间隔、8000ms 超时、40ms 容差。国内直连和国际默认规则保持原有结构。

## 重要限制

1. 当前脚本只支持内联 `config.proxies` 节点数组；仅使用 `proxy-providers` 的订阅不受支持。
2. 节点地区识别依赖名称和旗帜标记；无法识别的节点保留在手动列表，但不会自动进入地区候选池。
3. URLTest 测的是单个 HTTP 探测目标的延迟，不等同于实际下载速度、丢包率或流式连接质量。
4. Fallback 是固定顺序故障转移，不会选择最低延迟节点。
5. 自动切换不能迁移已有连接，也不能自动续写已中断的模型答案。
6. GitHub 保存的是源码；Clash Verge Rev 不会自动从 GitHub 更新脚本，需要手动替换并更新订阅。

## 回滚

若更新后订阅应用失败或代理组异常：

1. 停止代理。
2. 恢复安装前备份的扩展脚本。
3. 重新更新原订阅。
4. 确认旧配置恢复后，再检查新版本脚本和内核兼容性。
