# Mini-Program

个人小程序、浏览器脚本与实用配置源码库。

**源码主库：** 本仓库 `main` 分支。后续程序的正式源码、版本和说明以 GitHub 为准；网盘同步不再作为源码主存储。

## 目录约定

- `apps/`：独立网页应用（HTML/CSS/JS）。
- `userscripts/`：Tampermonkey 用户脚本。
- `extensions/`：独立浏览器扩展。
- `network/`：网络工具、代理客户端配置与扩展脚本。
- `archive-manifests/`：正式归档文件索引。
- `catalog.json`：程序目录，供后续个人工具首页读取。

## 当前收录

| 程序 | 类型 | 版本 | 状态 |
|---|---|---:|---|
| 学习通作业图文导出（AI友好版） | Tampermonkey 用户脚本 | 1.3.1 | 使用中 |
| Clash Verge Rev / FlClash 智能分流扩展 | 代理客户端共享分流脚本 | 2026-11-22.1 | 试运行，真实长连接稳定性待实测 |

### 学习通作业图文导出

- [安装脚本](https://raw.githubusercontent.com/exekillte/Mini-Program/main/userscripts/chaoxing-question-export/chaoxing-question-export.user.js)
- [使用说明](userscripts/chaoxing-question-export/README.md)

### 网络配置与智能分流

- [网络配置总目录](network/README.md)
- [统一分流脚本源码（2026-11-22.1）](https://raw.githubusercontent.com/exekillte/Mini-Program/main/network/clash-verge-rev/clash-verge-rev-extension.js)
- [Clash Verge Rev 桌面端说明](network/clash-verge-rev/README.md)
- [FlClash Android 操作流程](network/flclash-android/README.md)
- [版本记录](network/clash-verge-rev/CHANGELOG.md)

Android 版 FlClash 与桌面端共用同一份分流脚本。ChatGPT 保留 URLTest + Fallback + 手动子组；GitHub 新增专用 URLTest 自动分流；Google、TikTok、OneDrive、Steam、俄站和国际默认组使用各自的 URLTest 健康检查。Bilibili 新增默认 DIRECT 的手动港澳台选择器，可在规则模式下切换出口。HTTP 探测不能保证 SSE/WebSocket 长连接不中断，也不能迁移已建立的旧连接。安卓端需要在当前订阅的「覆写」设置中绑定 JavaScript 脚本，具体步骤见 Android 操作指南。

## 版本维护约定

1. 修改前先读取仓库当前版本，避免覆盖较新的改动。
2. 正式发布时更新脚本头部的版本标识和对应说明。
3. 用户脚本尽量使用稳定的 Raw URL 作为 `@downloadURL` 和 `@updateURL`。
4. 删除程序时先从 `catalog.json` 标记下架或移除目录项；Git 历史保留版本变更记录。
5. 不把账号密码、访问令牌、机场订阅链接或私人配置提交到公开仓库。
