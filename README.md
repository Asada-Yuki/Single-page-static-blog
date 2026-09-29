# 单一时间流

个人文字与图片时间流。公开端只有 `/`；作者端由 Cloudflare Worker 提供。每篇内容只有 Markdown 文件，UTC 时间来自文件名。

## 页面与存储

- 页面是单一连续时间流，按 UTC 从新到旧排列。
- 桌面侧栏预览最近 8 条；窄屏底栏显示最近 5 条并跳到对应内容。主时间流始终连续，靠上下滚动浏览，没有分页。
- 正文、图片与外部视频链接构成每条记录；没有标签、分类、评论、搜索、分页或归档。
- 构建生成静态 `dist/index.html`；只有图片全屏查看器使用少量前端 JavaScript，其余页面内容在构建时生成。
- 点击文章图片可打开全屏查看器；多图文章可用左右按钮或键盘方向键切换，按 Esc 关闭。
- Cloudflare Worker 的 `/write` 提供私有作者入口，并将正文和图片作为一个 GitHub commit 发布。
- 此仓库可公开读取；推送到仓库的文章、图片和 Git 历史也会公开。不要把草稿、密钥或私人资料推送到仓库。

## 本地构建

```sh
npm ci
npm run build
npm test
```

`npm test` 使用模拟 GitHub API 检查 Worker 登录、会话与发布流程。构建输出在 `dist/`。本地预览：

```sh
python3 -m http.server 8080 --directory dist
```

作者名在 `site.json`。UTC 内容文件放在 `content/YYYY/MM/`，图片放在 `public/images/YYYY/MM/`。

## Cloudflare Pages

此项目使用仓库根目录构建：

| 设置 | 值 |
|---|---|
| Production branch | `main` |
| Build command | `npm ci && npm run build` |
| Build output directory | `dist` |

Cloudflare Pages 收到 `main` 的提交后会自动构建并部署。

## 作者写作页 Worker

Worker 配置已指向 `Asada-Yuki/Single-page-static-blog` 的 `main` 分支。首次部署需在 Cloudflare 登录，并设置两个 Secret：

```sh
cd worker
npx wrangler@4 login
openssl rand -hex 32
npx wrangler@4 secret put AUTHOR_KEY
npx wrangler@4 secret put GITHUB_TOKEN
npx wrangler@4 deploy
```

GitHub token 只需对此仓库的 `Contents: Read and write` 权限。不要提交 `AUTHOR_KEY` 或 `GITHUB_TOKEN`。Worker 路由把 `https://www.yuki.art/write` 和 `https://yuki.art/write` 设为作者入口；`/api/*` 和写作页资源也交给 Worker。公开时间流仍由 Pages 提供。

日常发布只需打开 `/write` 并输入作者密钥。终端只用于部署、更新或更换密钥。

会话 Cookie 为 `HttpOnly`、`Secure`、`SameSite=Strict`，有效期 180 天。更换 `AUTHOR_KEY` 会使现有会话失效。

## UTC 内容格式

每次发布生成一个 Markdown 文件，例如：

```text
content/2026/09/2026-09-27T15-34-03.123Z-a1b2c3d4e5f60718293a4b5c6d7e8f90.md
```

文件名使用 ISO 8601 UTC，冒号替换为连字符。页面日期、时间和排序全部使用 UTC。正文没有 Front Matter；短句、长文、图片和视频链接都使用同一种记录格式。

图片在浏览器中压缩为 WebP，最长边 2048 像素，每篇最多 5 张、每张不超过 1 MB。YouTube、Vimeo 和 Bilibili 的独占行链接会显示为延迟加载播放器；原始 HTML 关闭。

发布尝试使用 Worker 生成的 UTC 时间和唯一标识。重试沿用相同文件路径，避免网络中断后出现重复条目。

文章可直接在 GitHub 编辑或删除。Pages 会随 `main` 提交重新构建，Git 历史保留旧版本。
