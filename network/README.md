# Network

网络工具、代理客户端配置与扩展脚本的集中目录。

## 分类

- `clash-verge-rev/`：Clash Verge Rev 的订阅扩展脚本及其使用说明。
- `flclash-android/`：Android 版 FlClash 的脚本导入、订阅绑定、应用与验收流程。

## 当前网络分流方案

电脑端 Clash Verge Rev 与 Android 端 FlClash 共用同一份 JavaScript 分流脚本，避免两端的业务规则长期分叉。

- **统一脚本源码：** [clash-verge-rev-extension.js](clash-verge-rev/clash-verge-rev-extension.js)
- **桌面端使用说明：** [Clash Verge Rev 智能分流扩展](clash-verge-rev/README.md)
- **安卓端操作流程：** [FlClash Android 网络分流配置流程](flclash-android/README.md)

安卓端需要在 FlClash 中创建 JavaScript 脚本，并在当前订阅的「覆写」设置中明确绑定该脚本；仅保存脚本不会自动启用。详细步骤、策略组验收与回滚方法见安卓端指南。

## 维护规则

1. GitHub `main` 分支为正式源码版本。
2. 只提交通用配置逻辑和公开说明；不提交机场订阅链接、账号凭据、访问令牌或其他私人配置。
3. 每个工具独立建目录，源码与说明放在同一目录。
4. Android 与桌面端优先复用同一份规则脚本；客户端差异写入各自操作指南，不复制维护两套规则。
