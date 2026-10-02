# 单一时间流

个人文字与图片时间流。首页提供完整时间线，每篇内容另有永久分享地址；作者端由 Cloudflare Worker 提供。每篇内容只有 Markdown 文件，UTC 时间来自文件名。

## 页面与存储

- 首页是单一连续时间流，按 UTC 从新到旧排列；每篇内容另有 `/p/<Markdown 文件名>/` 永久分享地址。
- 桌面侧栏预览阅读位置附近的 8 条；窄屏底栏显示附近的 5 条并跳到对应内容。主时间流始终连续，靠上下滚动浏览，没有分页。
- 正文、图片与外部视频链接构成每条记录；没有标签、分类、评论、搜索、分页或归档。
- 构建生成静态首页、每篇内容的分享页面、404 页面、RSS、站点地图和爬虫规则。分享页面先静态展示目标条目，再按需载入相邻时间流，并为目标内容输出独立的 Open Graph 与 Twitter 元信息，供 Telegram、X 等平台生成链接预览。
- 内容永久地址由 Markdown 文件名决定，不含 `.md`；正文编辑不改变地址。删除内容后，下一次构建移除对应分享页面并返回 404。旧的首页 `#entry-…` 链接继续可用。
- RSS 每项链接指向新的永久分享地址；旧 `guid` 继续使用首页锚点身份，避免订阅器把历史内容识别为新条目。站点地图同时列出首页和每篇分享地址。
- 侧栏会标记当前阅读位置。首页先输出最新 12 条，分享页先输出目标 1 条；JavaScript 按每 12 条的静态数据块连续加载相邻内容。关闭 JavaScript 时，分享正文和相邻永久链接仍可阅读。
- 点击文章图片可打开全屏查看器；多图文章可用左右按钮或键盘方向键切换，按 Esc 关闭。
- 图片可以填写替代文字，供读屏软件描述图片；空白时使用通用替代文字。
- 页脚保持一行，只放版权、UTC 说明、RSS、关于与回到顶部。
- Cloudflare Worker 的 `/write` 提供私有作者入口，并将正文和图片作为一个 GitHub commit 发布。
- Worker 写作页的 HTML、CSS 和 JavaScript 会从 `worker/public/` 生成到 `worker/src/writer-assets.js`，因此线上编辑器部署与 Wrangler 部署都能发布同一版后台界面。
- 草稿文字、图片和说明保存在当前浏览器 IndexedDB。每个标签页独立拥有草稿；发布后可恢复最近一次提交的内容。浏览器存储不可用时仅保留文字并明确提示。不要在公共设备保留草稿。
- 登录接口按客户端 IP 限制每分钟 10 次尝试。Cloudflare Worker 的限速状态按边缘位置近似计数，不是严格的全球计量；详见 [Cloudflare Rate Limiting 文档](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)。
- 此仓库可公开读取；推送到仓库的文章、图片和 Git 历史也会公开。不要把草稿、密钥或私人资料推送到仓库。

## 本地构建

```sh
npm ci
npm run build
npm test
npm run test:browser
```

本地与 CI 使用 `.nvmrc` 中的 Node 22 LTS 补丁版本。浏览器测试在本机使用隔离的 Chrome，在 CI 使用 Chromium；XML 校验需要 Python 3。

`npm run build` 会先同步 Worker 写作页资源，再构建静态站点。`npm test` 会检查构建输出、Worker 资源与登录限速、会话和发布流程。构建输出在 `dist/`。本地预览：

```sh
python3 -m http.server 8080 --directory dist
```

作者名在 `site.json`。UTC 内容文件放在 `content/YYYY/MM/`，图片放在 `public/images/YYYY/MM/`。

## Cloudflare Pages

此项目使用仓库根目录构建：

| 设置 | 值 |
|---|---|
| Production branch | `main` |
| Build command | `npm ci && npm test && npm run build` |
| Build output directory | `dist` |

Cloudflare Pages 收到 `main` 的提交后会自动构建并部署。

## 作者写作页 Worker

Worker 配置已指向 `Asada-Yuki/Single-page-static-blog` 的 `main` 分支。首次部署需在 Cloudflare 登录，并设置两个 Secret：

```sh
npx wrangler login
openssl rand -hex 32
npx wrangler secret put AUTHOR_KEY --config worker/wrangler.toml
npx wrangler secret put GITHUB_TOKEN --config worker/wrangler.toml
npm run build:worker-assets
npx wrangler deploy --config worker/wrangler.toml
```

GitHub token 只需对此仓库的 `Contents: Read and write` 权限。不要提交 `AUTHOR_KEY` 或 `GITHUB_TOKEN`。Worker 路由把 `https://www.yuki.art/write` 和 `https://yuki.art/write` 设为作者入口；`/api/*` 和写作页资源也交给 Worker。公开时间流仍由 Pages 提供。

日常发布只需打开 `/write` 并输入作者密钥。终端只用于部署、更新或更换密钥。

会话 Cookie 为 `HttpOnly`、`Secure`、`SameSite=Strict`，有效期 30 天，退出会撤销服务端会话，复制旧 Cookie 也不能继续使用。此次升级会要求重新登录一次。更换 `AUTHOR_KEY` 会使现有会话失效。

登录 Worker 绑定了 Cloudflare 原生限速，需要 Wrangler 4.36.0 或更新版本。当前规则是每个客户端 IP 每 60 秒最多 10 次登录尝试；限速器失效或未配置时，登录会暂停，而不是跳过保护。该限速按 Cloudflare 边缘位置近似工作，不应用于严格的全局计数。

## UTC 内容格式

每次发布生成一个 Markdown 文件，例如：

```text
content/2026/09/2026-09-27T15-34-03.123Z-a1b2c3d4e5f60718293a4b5c6d7e8f90.md
```

文件名使用 ISO 8601 UTC，冒号替换为连字符。页面日期、时间和排序全部使用 UTC。正文没有 Front Matter；短句、长文、图片和视频链接都使用同一种记录格式。

图片在浏览器中压缩为 WebP，最长边 2048 像素，每篇最多 5 张、每张不超过 1 MB。YouTube、Vimeo 和 Bilibili 的独占行链接会显示为延迟加载播放器；原始 HTML 关闭。

发布尝试使用 Worker 生成的 UTC 时间和唯一标识。签名绑定 UTC 时间、唯一标识和整份草稿的 SHA-256。原样重试沿用同一路径，内容变化会申请新的发布身份；既有不同正文或图片会返回冲突，不覆盖旧内容。后台会分别显示 GitHub 提交成功、等待构建、线上内容校验成功和更新尚未确认。

文章可直接在 GitHub 编辑或删除。Pages 会随 `main` 提交重新构建，Git 历史保留旧版本。

## 发布与恢复

Pages 自动发布 `main` 的静态内容；作者 Worker 需要单独部署。修改 Worker 后运行 `npm run build:worker-assets` 和 `npm run check:worker`，通过回归后再发布。不要把“GitHub 已提交”当作“网站已更新”。每篇的 `status.json` 校验真实正文哈希，`deployment.json` 记录构建版本。

Worker 的 SQLite Durable Object 保存会话撤销记录，并执行完整 WebP 解码校验，避免普通免费 Worker 请求承担图片解码的 CPU 开销。只保存会话 ID 与到期时间，不保存密钥、文章或图片。仍受免费额度限制；超过时应明确报错并保留草稿，不自动升级付费。

恢复步骤见 [运维说明](OPERATIONS.md)。生产域名配置和平台预览、实际 X/TG 卡片检查与代码测试分开记录。
