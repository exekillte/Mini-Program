# Clash Verge Rev 智能分流扩展

- 版本标识：`2026-11-16.1`
- 状态：**试运行，待真实订阅验证**
- 类型：Clash Verge Rev 订阅扩展脚本（JavaScript）
- 入口：`main(config, profileName)`

## 文件

- `clash-verge-rev-extension.js`：扩展脚本源码。
- `README.md`：安装、策略说明与限制。
- `CHANGELOG.md`：版本记录。

## 功能结构

脚本重建 `proxy-groups` 和 `rules`，不修改机场原始代理节点定义、DNS、TUN 设置或订阅地址。

| 可见策略组 | 自动组 | 选择机制 | 检测目标 |
|---|---|---|---|
| ChatGPT | GPT自动 | **Fallback** | `chatgpt.com/api/auth/providers` |
| Google | Google自动 | URLTest | `google.com/generate_204` |
| TikTok | TikTok自动 | URLTest | `tiktok.com` |
| 俄站 | 俄站自动 | URLTest | `yandex.ru` |
| OneDrive | OneDrive自动 | URLTest | `onedrive.live.com` |
| Steam | Steam自动 | URLTest | `store.steampowered.com` |
| 国内直连 | — | DIRECT | — |
| 国际默认 | 国际自动 | URLTest | `gstatic.com/generate_204` |

## ChatGPT 故障转移策略（2026-11-16.1）

本次只调整 GPT 自动组，其余业务组保持上一版配置。

| 参数 | 新设置 | 作用 |
|---|---:|---|
| 自动组类型 | `fallback` | 按候选顺序选择第一个健康节点 |
| 探测地址 | `https://chatgpt.com/api/auth/providers` | 检查 ChatGPT 认证初始化入口 |
| 预期 HTTP 状态 | `200` | 只将 HTTP 200 视为健康 |
| 检测间隔 | 60 秒 | 定期刷新健康状态 |
| 检测超时 | 3000ms | 超时节点判定为不可用 |
| `lazy` | `false` | 即使 GPT 自动组未被选中，也持续检查 |
| `max-failed-times` | 2 | 两次实际连接失败触发一次主动健康检查 |

### 节点顺序

**日本 → 美国 → 新加坡 → 台湾 → 韩国 → 英国**

Fallback 不再维护 URLTest 的 `fastNode` 最优节点缓存，而是根据当前健康状态按顺序选择第一个可用节点。因此：

- 日本探测失败、美国探测成功：自动使用美国
- 日本恢复健康：下一次选择时日本重新获得优先级
- 日本、美国都不可用：继续尝试新加坡等后续节点
- 所有节点都不可用：只能退回列表首项，无法凭空创造可用线路

**重要取舍：Fallback 不比较节点延迟。** 日本只要通过健康检查，即使美国延迟更低，也会优先使用日本。这一版本优先解决失效节点卡住的问题，而不是追求最低延迟。如果你说的“红色”只是延迟偏高、但该节点仍能在 3 秒内返回 HTTP 200，Fallback 不会因此切换。

### 失败触发机制

`max-failed-times: 2` 不是“连续两次健康检查失败就切换”。它表示代理实际拨号连续失败达到两次时，触发一次主动健康检查；`timeout: 3000` 同时限定这段失败计数窗口和健康检查超时。

## 安装

1. 在 Clash Verge Rev 中先备份当前正在使用的扩展脚本。
2. 打开目标订阅卡片的右键菜单，进入「扩展脚本」。
3. 获取 `clash-verge-rev-extension.js` 的完整内容，粘贴到编辑器并保存。
4. 更新订阅，检查扩展脚本日志和配置校验结果。
5. 在代理页面打开 ChatGPT 策略组，将上层选择器切换到 `♻️ GPT自动`，不要直接选择日本或美国节点；直接选择单个节点会绕过自动故障转移组。
6. 等待首次健康检查完成，至少观察一个 60 秒周期。
7. 实测 ChatGPT 页面加载、账号界面、发送消息、连续对话和流式响应。

**验证期间不要使用 Clash Verge Rev 的“手动测速全部节点”或单节点延迟测试来判断 GPT 健康状态。** 已有客户端问题报告指出，部分手动测速路径不传递策略组的 `expected-status`，可能把 HTTP 302 显示为成功，并覆盖同 URL 的健康状态。应先让自动健康检查自行运行。

**建议只绑定到目标订阅的订阅扩展脚本，不要直接放入全局扩展脚本。** 本脚本会整体重建代理组和规则；若全局应用到节点命名或订阅结构不同的其他订阅，可能产生不符合预期的结果。

## 重要限制

1. **这是故障转移，不是最低延迟择优。** Fallback 按顺序使用第一个健康节点，不会因为美国延迟比日本低几十毫秒就主动切换。
2. **健康检查只是业务可达性的近似指标。** `/api/auth/providers` 能验证 ChatGPT 认证初始化入口的 HTTP 可达性，但不能证明账号登录、Cloudflare 验证、WebSocket、消息提交或流式响应正常。
3. **红色状态需要区分含义。** 如果日本节点只是延迟较高但仍通过 HTTP 200 检查，它仍被视为健康；只有连接失败、超时或状态码不符才会被跳过。
4. **手动测速可能污染健康状态。** 这是 Clash Verge Rev 客户端层面的已报告问题，扩展脚本不能修复客户端测速调用链。
5. **自动切换不是无缝迁移。** 切换节点可能中断已有 WebSocket 或正在进行的请求。
6. 当前版本要求订阅配置中存在内联 `config.proxies` 节点数组；仅使用 `proxy-providers` 的订阅不受支持，脚本会主动报错。
7. GitHub 保存的是源码；Clash Verge Rev 不会因为该文件位于 GitHub 就自动更新脚本。需要更新时，手动获取最新源码并替换扩展脚本内容。

## 回滚

若订阅更新失败或业务异常，恢复安装前备份的扩展脚本，再重新更新订阅。

## 官方文档与相关问题

- [Mihomo Fallback 代理组](https://wiki.metacubex.one/en/config/proxy-groups/fallback/)
- [Mihomo 通用代理组字段](https://wiki.metacubex.one/en/config/proxy-groups/)
- [Mihomo URLTest 选择器故障 #3337](https://github.com/MetaCubeX/mihomo/issues/3337)
- [Clash Verge Rev 手动测速健康状态问题 #8531](https://github.com/clash-verge-rev/clash-verge-rev/issues/8531)
- [Clash Verge Rev 扩展脚本指南](https://clash-verge-rev.github.io/docs/guide/extend.html)
