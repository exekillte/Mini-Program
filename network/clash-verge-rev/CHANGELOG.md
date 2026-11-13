# Changelog

## 2026-11-13 — URLTest 自动择优修订

### Changed
- ChatGPT、Google、OneDrive 从 Fallback 改为 URLTest，避免固定优先级节点长期占用。
- TikTok、Steam、国际默认统一调整为 180 秒检测间隔、40ms 切换容差。
- 俄站改用 Yandex 作为业务探测目标，并使用 URLTest。
- ChatGPT 自动候选增加台湾地区。
- 保留 8000ms 检测超时、2 次失败阈值和 lazy 检测，兼顾故障识别与稳定性。

### Validation
- JavaScript 编译与模拟订阅执行通过。
- 已检查自动组类型、探测地址、间隔、容差和台湾候选。
- 尚未在用户的真实机场订阅和 Clash Verge Rev 客户端中完成实机验证。
- URLTest 只按探测 URL 的 HTTP 响应延迟择优，不等于吞吐量、丢包率或 ChatGPT 流式连接质量测试。

## 2026-11-08 — Initial GitHub archive
- 首次纳入 GitHub 源码库。
- 新增真实代理节点筛选与地区候选池。
- 增加业务分流、安装说明、回滚说明和已知限制。
