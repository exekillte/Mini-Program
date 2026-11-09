# Mini-Program · 我的工具库

这里是个人小程序、油猴脚本和网络扩展的 **统一源码库**。不必学会 GitHub 的代码操作：**从下表点击对应工具即可**。

## 快速入口（优先看这里）

| 工具 | 直接获取 | 说明 / 源码 | 当前状态 |
|---|---|---|---|
| **学习通图文导出** | [安装油猴脚本](https://raw.githubusercontent.com/exekillte/Mini-Program/main/userscripts/chaoxing-question-export/chaoxing-question-export.user.js) | [使用说明](userscripts/chaoxing-question-export/README.md) | v1.3.1 |
| **Clash Verge Rev 智能分流** | [下载 JS 扩展](https://github.com/exekillte/Mini-Program/raw/refs/heads/main/network/clash-verge-rev/clash-verge-rev-extension.js) | [使用说明](network/clash-verge-rev/README.md) | 待实机验证 |
| **PDF 工坊** | [下载 HTML](https://github.com/exekillte/Mini-Program/raw/refs/heads/main/apps/pdf-toolbox.html) | [查看源码](apps/pdf-toolbox.html) | 已收录 |
| **PDF 合并** | [下载 HTML](https://github.com/exekillte/Mini-Program/raw/refs/heads/main/apps/pdf-merge.html) | [查看源码](apps/pdf-merge.html) | 已收录 |
| **PDF 提取与导出** | [下载 HTML](https://github.com/exekillte/Mini-Program/raw/refs/heads/main/apps/pdf-extract.html) | [查看源码](apps/pdf-extract.html) | 已收录 |

**如何使用：** 油猴脚本需要 Chrome + Tampermonkey，打开安装地址后按油猴提示安装；Clash 扩展脚本在 Clash Verge Rev 的订阅扩展功能中使用；PDF 工具下载为 `.html` 文件后在浏览器打开。下载/更新需要网络能访问 GitHub；部分 HTML 功能还会加载外部 JavaScript 库。

> 注意：GitHub 是源码仓库，不是已经部署好的在线工具站。这里的“下载 HTML”表示获取网页程序文件，不是直接进入在线服务。

## 使用这个仓库的最简方式

1. 浏览器把本仓库首页加入书签：https://github.com/exekillte/Mini-Program/
2. 以后找程序，**向下滚动到「快速入口」直接点击**，不用逐层展开文件夹。
3. 想让 ChatGPT 修改程序，只要说“读取 Mini-Program 中的学习通导出脚本，修改……”，不必重新上传源码。
4. 程序更新后会保留同一个下载地址；油猴脚本还应更新 `@version` 才能触发常规版本更新。
5. 如果脚本有故障，到 [Issues（问题反馈）](https://github.com/exekillte/Mini-Program/issues) 记录即可；不会自动修复，仍需有人或自动化工作流处理。

## 程序分类

- `apps/`：可下载的 HTML 单文件工具。
- `userscripts/`：Tampermonkey 油猴脚本。
- `network/`：网络配置与扩展。
- `catalog.json`：供未来工具中心读取的机器可读目录。

### 版本维护规则

- **仓库 `main` 为权威源码**，避免反复在各设备互相覆盖。
- 修改前先读最新版本；修改后验证并更新版本号。
- 原有三个无扩展名的 PDF 文件暂时保留，`apps/` 中提供同内容、带 `.html` 后缀的便捷副本。
- 删除目录条目不会自动远程卸载其他电脑已安装的油猴脚本；软件目录、源代码、设备安装状态分别管理。
- 此仓库为 Public，禁止提交账号密码、API Key、私有订阅地址及个人敏感数据。
