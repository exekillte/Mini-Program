# Changelog

## 2026-11-13.2 — GPT 专用探测与持续测速

### Changed
- GPT 自动组的探测地址从 ChatGPT 首页改为 `https://chatgpt.com/api/auth/providers`，预期状态限定为 HTTP 200。
- GPT 自动组设置为 `lazy: false`，即使上层当前选择手动节点，也持续更新测速结果。
- GPT 自动组检测间隔从 180 秒缩短至 90 秒，超时从 8000ms 降至 5000ms，切换容差从 40ms 调整为 30ms。
- GPT 自动候选地区顺序改为日本、美国、新加坡、台湾、韩国、英国，以改善无测速记录时的冷启动落点。
- 其他业务组保持上一版参数，避免全体节点同时增加测速负载。

### Validation
- 完整 JavaScript 在 V8 环境中编译并执行通过。
- 使用模拟订阅验证 GPT 自动组参数、候选顺序、父级选择器、其他业务组参数和最终 MATCH 规则。
- 尚未在用户真实机场订阅与 Clash Verge Rev 客户端中完成实机验证。
- 探测只验证 ChatGPT 认证提供商入口的 HTTP 可达性，不等于账号登录、Cloudflare 验证或 WebSocket/消息提交测试。

## 2026-11-13 — URLTest 自动择优修订
- ChatGPT、Google、OneDrive 从 Fallback 改为 URLTest。
- 业务组统一使用 180 秒检测间隔、40ms 切换容差和 8000ms 检测超时。
- ChatGPT 自动候选增加台湾地区。
- 尚未完成真实订阅实机验证。

## 2026-11-08 — Initial GitHub archive
- 首次纳入 GitHub 源码库。
- 新增真实代理节点筛选与地区候选池。
- 增加业务分流、安装说明、回滚说明和已知限制。
