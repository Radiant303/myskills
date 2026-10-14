# BOSS投递助手 (Chrome 扩展)

在 BOSS 直聘页面内显示一个悬浮面板，按**公司规模**和**薪资**筛选岗位，并批量发送打招呼语。

> 只发送打招呼语，不自动发简历、不自动换联系方式。

## 功能

- 页面右下角悬浮面板，可拖动、可折叠
- 筛选条件：标题关键词、公司规模、日薪下限、校招月薪下限
- 排除公司黑名单（默认过滤大厂）
- 目标数量上限（默认 10，避免风控）
- 实时日志：每条显示公司、岗位、结果
- 开始 / 暂停 / 继续 / 停止
- 配置保存在 `chrome.storage.local`，不上传

## 安装（开发者模式加载）

1. 打开 Chrome/Edge，访问 `chrome://extensions`
2. 打开右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择本目录：`chrome-extensions/boss-job-apply`
5. 打开 BOSS 直聘职位搜索页，例如：
   `https://www.zhipin.com/web/geek/jobs?query=Java`
6. 右下角出现「BOSS投递助手」面板

## 使用

1. 在职位搜索结果页，填好招呼语和筛选条件
2. 点击「开始」
3. 面板会依次：读卡片 → 点开岗位 → 读公司规模和薪资 → 命中则点「立即沟通」→ 发送招呼语
4. 当前页跑完后，翻页再点「开始」继续

## 目录结构

```
boss-job-apply/
├── manifest.json        # Manifest V3
├── content/
│   ├── panel.js         # 悬浮面板 UI + 投递流程
│   └── panel.css        # 面板样式（Shadow DOM 隔离）
├── lib/
│   ├── filters.js       # 薪资/规模/关键词判断（纯函数）
│   └── dom.js           # BOSS 页面选择器封装
└── icons/               # 16/48/128 图标
```

## 注意事项

- 仅支持 `zhipin.com`，且必须已登录
- 不处理验证码；遇到验证码请手动完成后重试
- 单次目标建议不超过 20 条，投递间隔 3-8 秒随机
- BOSS 改版后若选择器失效，更新 `lib/dom.js` 中的 `SELECTORS`

## 重新核对选择器

打开职位页，在控制台执行：

```js
document.querySelectorAll('.job-card-box').length          // 职位卡片数量
document.querySelector('textarea.input')                    // 聊天输入框
document.querySelector('button.btn-send')                   // 发送按钮
```
