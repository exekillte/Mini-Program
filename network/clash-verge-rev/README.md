# Clash Verge Rev 智能分流扩展

- 版本标识：`2026-11-08`
- 状态：**待真实订阅实机验证**
- 类型：Clash Verge Rev 订阅扩展脚本（JavaScript）
- 入口：`main(config, profileName)`

## 文件

- `clash-verge-rev-extension.js`：扩展脚本源码。
- `README.md`：安装、策略说明与限制。
- `CHANGELOG.md`：版本记录。

## 功能结构

脚本重建 `proxy-groups` 和 `rules`，不修改机场原始代理节点定义、DNS、TUN 设置或订阅地址。

| 可见策略组 | 自动组 | 选择机制 |
|---|---|---|
| ChatGPT | GPT自动 | Fallback，按美国、日本、新加坡、韩国、英国顺序 |
| Google | Google自动 | Fallback，按美国、新加坡、日本顺序 |
| TikTok | TikTok自动 | URLTest |
| 俄站 | 俄站自动 | Fallback，仅俄罗斯候选 |
| OneDrive | OneDrive自动 | Fallback |
| Steam | Steam自动 | URLTest |
| 国内直连 | — | DIRECT |
| 国际默认 | 国际自动 | URLTest |

自动候选池只收录能够识别地区、协议类型、服务器和端口的真实代理节点。名称呈裸域名形式的条目（例如 `congyu.org`）不参与自动选择，但仍保留在手动候选列表中。

## 安装

1. 在 Clash Verge Rev 中先备份当前正在使用的扩展脚本。
2. 打开目标订阅卡片的右键菜单，进入「扩展脚本」。
3. 将 `clash-verge-rev-extension.js` 的完整内容复制到编辑器并保存。
4. 更新订阅，检查扩展脚本日志和配置校验结果。
5. 在代理页面确认以下入口：
   - ChatGPT：`♻️ GPT自动`
   - Google：`♻️ Google自动`
   - 国际默认：`♻️ 国际自动`
6. 首次应用后，分别验证 ChatGPT 登录/验证、Google 搜索与 Gemini、国际网站访问，以及国内网站直连。

**建议先绑定到目标订阅的订阅扩展脚本，不要直接放入全局扩展脚本。** 本脚本会整体重建代理组和规则；若全局应用到节点命名或订阅结构不同的其他订阅，可能产生不符合预期的结果。

## 重要限制

- 当前版本要求订阅配置中存在内联 `config.proxies` 节点数组；仅使用 `proxy-providers` 的订阅不受支持，脚本会主动报错。
- Fallback 按候选顺序选择可用节点，不等于最低延迟。
- URLTest 根据指定健康检查地址和延迟选择节点，不等于实际下载吞吐量测试。
- 健康检查不能完整模拟账号风控、Cloudflare 挑战、地区资格、付款中心或完整 WebSocket 会话。
- 自动切换不能保证已有连接无缝迁移。
- GitHub 保存的是源码；Clash Verge Rev 不会因为该文件位于 GitHub 就自动更新脚本。需要更新时，手动获取最新源码并替换扩展脚本内容。

## 回滚

若订阅更新失败或业务异常，恢复安装前备份的扩展脚本，再重新更新订阅。

## 官方文档

- [Clash Verge Rev 扩展脚本指南](https://clash-verge-rev.github.io/docs/guide/extend.html)
- [Mihomo 代理组配置](https://wiki.metacubex.one/config/proxy-groups/)
