# Clash Verge Rev 智能分流扩展

- 版本标识：`2026-11-13`
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
| ChatGPT | GPT自动 | URLTest | chatgpt.com |
| Google | Google自动 | URLTest | google.com/generate_204 |
| TikTok | TikTok自动 | URLTest | tiktok.com |
| 俄站 | 俄站自动 | URLTest | yandex.ru |
| OneDrive | OneDrive自动 | URLTest | onedrive.live.com |
| Steam | Steam自动 | URLTest | store.steampowered.com |
| 国内直连 | — | DIRECT | — |
| 国际默认 | 国际自动 | URLTest | gstatic.com/generate_204 |

## 自动选择参数

- **检测间隔：180 秒**。比旧版的 300–600 秒更及时。
- **切换容差：40ms**。避免只差几毫秒就频繁切换，同时不让明显慢很多的节点长期占用。
- **检测超时：8000ms**。
- **失败阈值：2 次**。
- **lazy：true**。只有自动组实际被选中时才进行周期检测，避免所有业务组持续同时测速。
- ChatGPT 自动候选增加台湾节点，并纳入美国、日本、新加坡、韩国、英国节点。

URLTest 根据各自检测目标的 HTTP 响应延迟选择较快节点；它不再按国家顺序固定使用第一个可用节点。

## 安装

1. 在 Clash Verge Rev 中先备份当前正在使用的扩展脚本。
2. 打开目标订阅卡片的右键菜单，进入「扩展脚本」。
3. 将 `clash-verge-rev-extension.js` 的完整内容复制到编辑器并保存。
4. 更新订阅，检查扩展脚本日志和配置校验结果。
5. 在代理页面确认以下入口：
   - ChatGPT：`♻️ GPT自动`
   - Google：`♻️ Google自动`
   - 国际默认：`♻️ 国际自动`
6. 将 ChatGPT 的上层选择器设为 `♻️ GPT自动`，否则选择具体节点时自动组不会替你切换。
7. 观察至少一个完整检测周期，再验证 ChatGPT 页面加载、消息提交和连续对话。

**建议先绑定到目标订阅的订阅扩展脚本，不要直接放入全局扩展脚本。** 本脚本会整体重建代理组和规则；若全局应用到节点命名或订阅结构不同的其他订阅，可能产生不符合预期的结果。

## 重要限制

1. **延迟不等于真实业务体验。** URLTest 只测指定 URL 的 HTTP 响应延迟，不直接测下载吞吐量、丢包率、抖动、WebSocket 稳定性，也不能模拟 ChatGPT 登录、消息生成和流式响应。
2. **检测存在时间窗口。** 180 秒是周期检测间隔；网络可能在两次检测之间变差。实际请求失败达到阈值时 Mihomo 可触发强制健康检查，但不保证每次卡顿都立即切换。
3. **业务目标存在偏差。** ChatGPT 使用 chatgpt.com 作为探测目标，Google 使用 204 探测地址；探测结果只是业务可达性的近似指标，不是完整应用测试。
4. **俄罗斯组使用 Yandex 作为探测目标。** 这能比较俄罗斯候选到 Yandex 的响应，不保证所有俄站表现一致。
5. 当前版本要求订阅配置中存在内联 `config.proxies` 节点数组；仅使用 `proxy-providers` 的订阅不受支持，脚本会主动报错。
6. `lazy: true` 时，若 ChatGPT 上层选择器改为某个具体节点而不是 `♻️ GPT自动`，自动组不再持续检测。
7. GitHub 保存的是源码；Clash Verge Rev 不会因为该文件位于 GitHub 就自动更新脚本。需要更新时，手动获取最新源码并替换扩展脚本内容。

## 回滚

若订阅更新失败或业务异常，恢复安装前备份的扩展脚本，再重新更新订阅。

## 官方文档

- [Mihomo URLTest 代理组](https://wiki.metacubex.one/en/config/proxy-groups/url-test/)
- [Mihomo Fallback 代理组](https://wiki.metacubex.one/en/config/proxy-groups/fallback/)
- [Mihomo 代理组通用字段](https://wiki.metacubex.one/en/config/proxy-groups/)
- [Clash Verge Rev 扩展脚本指南](https://clash-verge-rev.github.io/docs/guide/extend.html)
