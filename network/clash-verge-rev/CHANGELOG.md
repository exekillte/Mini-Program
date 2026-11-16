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
