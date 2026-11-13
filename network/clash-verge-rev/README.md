# Clash Verge Rev 智能分流扩展

- 版本标识：`2026-11-13.2`
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
| ChatGPT | GPT自动 | URLTest | `chatgpt.com/api/auth/providers` |
| Google | Google自动 | URLTest | `google.com/generate_204` |
| TikTok | TikTok自动 | URLTest | `tiktok.com` |
| 俄站 | 俄站自动 | URLTest | `yandex.ru` |
| OneDrive | OneDrive自动 | URLTest | `onedrive.live.com` |
| Steam | Steam自动 | URLTest | `store.steampowered.com` |
| 国内直连 | — | DIRECT | — |
| 国际默认 | 国际自动 | URLTest | `gstatic.com/generate_204` |

## ChatGPT 自动选择（2026-11-13.2）

本次只重点调整 GPT 自动组，不改变其他业务组的检测策略：

| 参数 | 新设置 | 作用 |
|---|---:|---|
| 探测地址 | `https://chatgpt.com/api/auth/providers` | 检查 ChatGPT 认证初始化入口 |
| 预期 HTTP 状态 | `200` | 过滤挑战页、拒绝访问和异常响应 |
| 检测间隔 | 90 秒 | 更快更新节点状态 |
| 检测超时 | 5000ms | 避免慢节点长时间占用 |
| 切换容差 | 30ms | 避免微小抖动频繁切换 |
| lazy | `false` | 即使 GPT 自动组暂未选中，也持续检测 |
| 失败阈值 | 2 次 | 保留失败触发机制 |

GPT 自动候选顺序调整为：**日本 → 美国 → 新加坡 → 台湾 → 韩国 → 英国**。Mihomo 在尚无有效测速记录时可能先使用候选列表首项，因此将近期实测表现较好的日本放在冷启动首位；后续由 URLTest 根据同一 ChatGPT 探测地址的实际结果择优。

其余业务组仍保留 180 秒检测间隔、40ms 容差和 `lazy: true`，避免所有业务组持续对全部节点发起测速。

## 安装

1. 在 Clash Verge Rev 中先备份当前正在使用的扩展脚本。
2. 打开目标订阅卡片的右键菜单，进入「扩展脚本」。
3. 获取 `clash-verge-rev-extension.js` 的完整内容，粘贴到编辑器并保存。
4. 更新订阅，检查扩展脚本日志和配置校验结果。
5. 在代理页面打开 ChatGPT 策略组，将上层选择器切换到 `♻️ GPT自动`。
6. 等待首次健康检查完成，再观察至少一个 90 秒检测周期。
7. 实测 ChatGPT 页面加载、账号界面、发送消息、连续对话和流式响应。

**建议只绑定到目标订阅的订阅扩展脚本，不要直接放入全局扩展脚本。** 本脚本会整体重建代理组和规则；若全局应用到节点命名或订阅结构不同的其他订阅，可能产生不符合预期的结果。

## 重要限制

1. **HTTP 延迟不等于真实业务体验。** URLTest 只测指定 URL 的 HTTP 响应延迟，不直接测下载吞吐量、丢包率、抖动、WebSocket 稳定性，也不能模拟已登录会话、Cloudflare 人机验证、模型选择、消息提交和流式响应。
2. **认证入口只是近似探测。** `/api/auth/providers` 是无需登录即可读取认证提供商信息的入口。它能验证 ChatGPT 域名及认证初始化路径的 HTTP 可达性，但不能证明用户账号状态或对话后端可用。若该接口未来改版、被 Cloudflare 挑战或返回非 200，GPT 自动组可能把实际可用的节点判为失败。
3. **自动切换不是无缝迁移。** 切换节点可能中断已有 WebSocket 或正在进行的请求；重新发起请求通常比保持原连接更可靠。
4. **探测存在时间窗口。** GPT 自动组每 90 秒检测一次，网络可能在两次检测之间变差。非选中状态也会继续检测，以减少过期测速结果。
5. 当前版本要求订阅配置中存在内联 `config.proxies` 节点数组；仅使用 `proxy-providers` 的订阅不受支持，脚本会主动报错。
6. GitHub 保存的是源码；Clash Verge Rev 不会因为该文件位于 GitHub 就自动更新脚本。需要更新时，手动获取最新源码并替换扩展脚本内容。

## 回滚

若订阅更新失败或业务异常，恢复安装前备份的扩展脚本，再重新更新订阅。

## 官方文档

- [Mihomo URLTest 代理组](https://wiki.metacubex.one/en/config/proxy-groups/url-test/)
- [Mihomo 代理组通用字段](https://wiki.metacubex.one/en/config/proxy-groups/)
- [Clash Verge Rev 扩展脚本指南](https://clash-verge-rev.github.io/docs/guide/extend.html)
