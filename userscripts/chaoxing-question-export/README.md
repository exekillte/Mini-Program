# 学习通作业图文导出（AI友好版）

- 当前版本：**1.3.1**
- 类型：Tampermonkey 用户脚本
- 基准版本：用户已测试的 v1.3.0
- 本次变化：保留 v1.3.0 的功能实现，仅增加 GitHub 项目主页、`@downloadURL` 和 `@updateURL`，并将分发版本号提升至 1.3.1，以支持脚本更新与 Tampermonkey Browser Sync。

## 安装

1. 确保浏览器已安装 Tampermonkey。
2. 打开 [安装脚本（GitHub Raw）](https://raw.githubusercontent.com/exekillte/Mini-Program/main/userscripts/chaoxing-question-export/chaoxing-question-export.user.js)。
3. 在 Tampermonkey 安装确认页选择安装。
4. 刷新学习通网页版作业页面。

## 自动更新

脚本通过 `@updateURL` 指向本仓库的 Raw 文件。Tampermonkey 检查更新时会读取此地址。后续发布新版本时，应更新脚本头部的版本号，并保持该地址稳定。

## Tampermonkey Browser Sync

如果使用 Browser Sync：
- 浏览器自身必须登录并启用同步。
- 脚本需要从公开网址安装，或具备有效的 `@downloadURL`。
- Browser Sync 的可用同步空间有限。
- 不同 Chrome 同步账号之间不会自动合并安装列表。

## 功能

- 检查：识别题目数量与异常项。
- 文字 TXT：导出题干、选项和图片引用。
- 图文 ZIP：导出题目文本、图片及必要的复核截图。
- 失败题分页：只截取提取异常或需要复核的题目。
- 网页分页：按网页可视区域高度生成分页图片。
- A4 分页：按 A4 纵向比例生成分页图片。
- 诊断：导出当前页面的 DOM 结构诊断文件。
- 面板可隐藏，右下角保留重新打开入口。

## 依赖与限制

- 截图依赖 html2canvas 1.4.1（通过 cdnjs 加载）。
- 仅处理当前页面已经加载的题目。
- 跨域图片、特殊 iframe、Canvas、复杂 CSS 可能无法完整截图。
- 截图由 DOM/CSS 重新渲染，不是操作系统原生屏幕截图。
- 导出文件由浏览器本地生成；脚本不会自动提交作业，也不会把题目内容上传到本仓库。
