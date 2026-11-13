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
| Clash Verge Rev 智能分流扩展 | Clash Verge Rev 订阅扩展脚本 | 2026-11-13 | 试运行，待实测 |

### 学习通作业图文导出

- [安装脚本](https://raw.githubusercontent.com/exekillte/Mini-Program/main/userscripts/chaoxing-question-export/chaoxing-question-export.user.js)
- [使用说明](userscripts/chaoxing-question-export/README.md)

### Clash Verge Rev 智能分流扩展

- [扩展脚本源码](https://raw.githubusercontent.com/exekillte/Mini-Program/main/network/clash-verge-rev/clash-verge-rev-extension.js)
- [使用说明](network/clash-verge-rev/README.md)
- [版本记录](network/clash-verge-rev/CHANGELOG.md)

## 版本维护约定

1. 修改前先读取仓库当前版本，避免覆盖较新的改动。
2. 正式发布时更新脚本头部的版本标识和对应说明。
3. 用户脚本尽量使用稳定的 Raw URL 作为 `@downloadURL` 和 `@updateURL`。
4. 删除程序时先从 `catalog.json` 标记下架或移除目录项；Git 历史保留版本变更记录。
5. 不把账号密码、访问令牌、机场订阅链接或私人配置提交到公开仓库。
