# FlClash Android 网络分流配置流程

本指南记录本次已在 Android 版 FlClash 中成功完成的脚本导入与订阅绑定流程。它复用仓库中的统一分流脚本，不另维护一份 Android 专用规则，避免电脑端与手机端规则逐渐分叉。

- 客户端：FlClash（Android）
- 配置方式：JavaScript 脚本覆写
- 脚本来源：`network/clash-verge-rev/clash-verge-rev-extension.js`
- 当前脚本版本：`2026-11-22.1`
- 脚本 Raw URL：<https://raw.githubusercontent.com/exekillte/Mini-Program/main/network/clash-verge-rev/clash-verge-rev-extension.js>

> 本流程记录的是本次成功操作路径。FlClash 后续版本可能调整菜单名称或位置；若界面不同，以当前版本实际显示为准。

## 一、准备工作

1. 安装并更新 FlClash。
2. 确认机场订阅已经导入，且当前使用的配置能够正常启动。
3. 记录当前订阅/覆写设置；如已有自定义脚本，先备份其完整内容。
4. 先确保当前网络可访问 GitHub Raw 源码地址。

不要把机场订阅链接、订阅令牌、账号凭据或个人节点配置上传到公开仓库。

## 二、创建 JavaScript 脚本

1. 打开 FlClash。
2. 进入底部的「工具」。
3. 打开「进阶配置」中的「脚本」。
4. 点击新增脚本。
5. 脚本名称填写 `PC-Routing`（名称只是便于识别，可以自定义）。
6. 类型选择 JavaScript。
7. 打开上方 Raw URL，复制完整源码。
8. 回到脚本编辑器，清空示例内容，再粘贴完整源码并保存。

源码必须整份替换，不要把新脚本追加在示例代码后面，也不要复制 Markdown 代码围栏。

## 三、将脚本绑定到当前订阅

保存脚本并不代表已经启用，必须在正在使用的订阅配置中选择它：

1. 返回「配置」页面，找到当前正在使用的机场订阅。
2. 点击该订阅卡片的更多菜单（三点菜单）。
3. 进入「更多」→「覆写」。
4. 将「覆写模式」切换为「脚本」。
5. 点击「前往配置脚本」或相应入口，打开脚本列表。
6. 找到刚才创建的 `PC-Routing`，选中它（确认选择状态已生效）。
7. 返回订阅覆写页面。

**关键检查：** 当前订阅必须明确绑定 `PC-Routing`。只创建或保存脚本、但没有在订阅覆写中选中它，不会改变当前代理规则。

## 四、预览并应用

1. 在覆写页面点击「预览」，检查脚本生成的配置。
2. 若预览正常，返回配置页面。
3. 点击「立即应用」；若当前版本没有该按钮，则重新加载/更新当前订阅配置。
4. 启动代理，并将运行模式设为「规则」，不要使用「全局」模式作为日常分流模式。

若预览时报错，先不要应用；根据错误信息排查，避免用不完整配置覆盖当前可用配置。

## 五、检查策略组

正常生成后应看到以下十个顶层业务组：

| 顶层策略组 | 对应自动组 | 选择机制 |
|---|---|---|
| 💬 ChatGPT | ♻️ GPT自动 / 🛟 GPT故障转移 / 🖐 GPT手动 | URLTest 默认、Fallback 备用、Select 手动 |
| 🐙 GitHub | ♻️ GitHub自动 | URLTest；可手动选择其他节点 |
| 🌐 Google | ♻️ Google自动 | URLTest |
| 📱 TikTok | ♻️ TikTok自动 | URLTest |
| 🪆 俄站 | ♻️ 俄站自动 | URLTest |
| ☁️ OneDrive | ♻️ OneDrive自动 | URLTest |
| 🎮 Steam | ♻️ Steam自动 | URLTest |
| 🇨🇳 国内直连 | DIRECT | 直连 |
| 📺 哔哩哔哩 | DIRECT / 港澳台节点 | 默认直连；手动选港澳台节点后强制代理 |
| 🌍 国际默认 | ♻️ 国际自动 | URLTest |

各顶层业务组应选择对应的自动组，而不是固定选择某一条单独节点。ChatGPT 组尤其要确认上层选择的是 `♻️ GPT自动`，否则会绕过自动故障转移。

### GPT 策略组（2026-11-22.1）

顶层「💬 ChatGPT」只保留三个入口：

1. **♻️ GPT自动（默认）**：URLTest，探测 `https://chatgpt.com/`，要求 HTTP 200；60 秒检测间隔、2500ms 超时、100ms 容差、`max-failed-times: 1`、`lazy: false`。它按 ChatGPT 主页探测延迟择优。
2. **🛟 GPT故障转移（备用）**：Fallback，30 秒检测间隔、2500ms 超时、`max-failed-times: 1`、`lazy: true`。候选顺序为美国 → 新加坡 → 台湾 → 日本 → 韩国 → 英国，按顺序选择第一个健康节点，不比较延迟。
3. **🖐 GPT手动**：需要手动指定出口时，先进入此子组，再选择具体节点。

**检查顶层实际选择。** 应显示「♻️ GPT自动」。如果显示「🛟 GPT故障转移」或「🖐 GPT手动」，当前流量就不会经过 GPT自动。

主页 HTTP 探测不是 WebSocket Upgrade 或模型流式传输测试。健康检查通过不代表账号登录、Cloudflare 验证、WebSocket、消息提交和长时间流式响应全部正常。代理组切换也不能迁移已经建立的旧连接。

### 其他业务自动组（2026-11-22.1）

| 自动组 | 检测间隔 | 超时 | 容差 | 失败阈值 | 健康检查目标 |
|---|---:|---:|---:|---:|---|
| GitHub | 60 秒 | 5000ms | 100ms | 1 | GitHub 首页，HTTP 200 |
| Google | 60 秒 | 5000ms | 100ms | 1 | Google `generate_204`，HTTP 204 |
| TikTok | 90 秒 | 5000ms | 80ms | 1 | TikTok 首页，HTTP 200/301/302 |
| 俄站 | 120 秒 | 5000ms | 80ms | 1 | Yandex，HTTP 200/301/302 |
| OneDrive | 90 秒 | 5000ms | 80ms | 1 | OneDrive 首页，HTTP 200/301/302 |
| Steam | 120 秒 | 5000ms | 80ms | 1 | Steam 商店，HTTP 200/301/302 |
| 国际默认 | 60 秒 | 5000ms | 100ms | 1 | gstatic `generate_204`，HTTP 204 |

这些组继续使用各自业务的探测地址，自动选择类型仍为 URLTest；没有增加固定顺序的 Fallback，以免再次出现只使用第一个健康节点、不比较延迟的问题。`lazy: true` 表示未选中的组不做周期检测。

GitHub 自动组默认选中，探测 `https://github.com/` 的 HTTP 200；GitHub 页面、API、Raw、Release、资源文件等域名统一进入 GitHub 组。该探测不等于 Git clone、SSH、API 认证或 LFS 下载的完整验收。

Bilibili 组不自动测速，默认选择 `DIRECT`。需要观看仅限港澳台的内容时，在「📺 哔哩哔哩」组手动选择香港、澳门或台湾节点即可；无需切换全局模式。没有识别到澳门节点时不会显示澳门选项。切回 `DIRECT` 即恢复国内直连。

**测速显示注意：** Clash Verge Rev 已有手动测速可能忽略 `expected-status`、以及界面延迟缓存可能滞后的公开问题（[Issue #8531](https://github.com/clash-verge-rev/clash-verge-rev/issues/8531)、[Issue #8646](https://github.com/clash-verge-rev/clash-verge-rev/issues/8646)）。单节点显示绿色不等于它通过了对应业务组的健康检查；需要同时验证真实网站访问。

## 七、验收

逐项打开网站并在 FlClash「连接」页检查实际命中的策略组：

| 测试网站 | 预期策略 |
|---|---|
| ChatGPT | 💬 ChatGPT → ♻️ GPT自动 |
| Gemini | 🌐 Google → ♻️ Google自动 |
| YouTube | 🌐 Google → ♻️ Google自动 |
| Reddit | 🌍 国际默认 → ♻️ 国际自动 |
| GitHub / Raw / Release | 🐙 GitHub → ♻️ GitHub自动 |
| Bilibili（日常） | 📺 哔哩哔哩 → DIRECT |
| Bilibili（港澳台限定内容） | 📺 哔哩哔哩 → 手动选择香港 / 澳门 / 台湾节点 |
| Taobao | 🇨🇳 国内直连 → DIRECT |

验收不应只看测速数字，还要确认网页能打开、账号状态能加载、消息能提交，以及连续使用时连接是否稳定。节点测速延迟仅是参考值，不等同于业务可用性或下载吞吐量。

## 八、常见问题与回滚

### 脚本列表中找不到脚本
- 检查脚本是否已经保存。
- 确认创建时选择的是 JavaScript 类型。
- 返回当前订阅的覆写页面，重新打开脚本选择列表。

### 预览没有出现十个策略组
- 检查当前订阅是否真的绑定了 `PC-Routing`。
- 检查是否应用了正确的订阅，而不是另一份配置。
- 检查脚本是否完整粘贴，尤其是首尾部分。

### 报错：订阅没有内联 proxies 节点
当前脚本要求配置中存在内联 `config.proxies` 节点数组。若机场订阅只使用 `proxy-providers`，当前脚本不兼容，需要针对该订阅结构适配；不要反复强制应用。

### 应用后无法联网或策略组异常
1. 停止代理。
2. 在订阅覆写设置中取消脚本覆写，或恢复此前备份的覆写设置。
3. 重新加载原订阅配置。
4. 确认原配置恢复正常后，再检查脚本错误。

## 九、版本维护

Android 与桌面端共用同一份分流脚本。更新时：

1. 以 GitHub 仓库中的最新版为准。
2. 复制最新 Raw 源码，完整替换 FlClash 中的旧脚本。
3. 保存后重新预览、应用并执行本指南的验收项目。
4. 不要把机场订阅地址、账号凭据或设备专属信息写入公开脚本或文档。

相关桌面端脚本说明：[`network/clash-verge-rev/README.md`](../clash-verge-rev/README.md)。两端共用 `2026-11-22.1` 脚本。
