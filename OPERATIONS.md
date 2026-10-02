# 维护与恢复

## 日常发文

打开 `https://yuki.art/write`。草稿在当前浏览器保存，不经过外部草稿服务。出现错误时保留当前页面；原样重试会沿用发布身份，避免重复。文字或照片变化会申请新身份。

“Committed to GitHub”意味着内容已进入仓库；“Published on the site”意味着公开站点的正文校验已经通过。等待超时不等于提交失败，不要复制相同内容重复发布。可点永久链接复查，也可恢复最近一次提交的内容。

存储被禁用、浏览器清除数据或磁盘故障都可能丢失本地草稿。重要长文在发布前自行另存副本。恢复按钮明确创建新草稿，不会自动重新发送。

## 开发发布

1. 用 `.nvmrc` 指定的 Node 版本执行 `npm ci`。
2. 执行 `npm test`、`npm run test:browser`、`npm run build`、`npm run check:worker` 和 `npm audit --audit-level=moderate`。
3. 确認旧永久链接、UTC 文件名和 RSS guid 没有改变；不要把测试条目写入实际 content。
4. 推送 `main` 会触发 Pages。网页、内容和 Worker 是两个发布目标，Worker 代码变更还需执行 `npx wrangler deploy --config worker/wrangler.toml`。
5. 确认 Cloudflare 生产构建成功，`https://yuki.art/deployment.json` 的 commit 对应本次版本；确认新版 `/write` 和两份导入模块可访问。
6. 真正检查网页、分享目标居中、上下滑动、字标、主题、图片查看、RSS/XML、404 与响应安全头。测试不向 X/TG 发消息。

构建会校验所有本地 WebP 能实际解码，并输出宽高；缺失、损坏、月份路径错误会中断构建。每篇 SSR 仅包含目标内容，时间流块按需加载，避免随着内容增长出现二次方输出。总输出预算 200 MiB、19,000 文件、单文件 25 MiB，超过时先检查，再调整预算。

## Cloudflare 配置

- Pages：生产分支 main；构建命令 `npm ci && npm test && npm run build`；输出 dist；根目录仓库根目录；Node 由 `.nvmrc` 固定。
- 预览和 pages.dev 加 noindex；主域保持可索引。www 应永久跳到 yuki.art，保持路径和查询参数。
- 写作/API 的 Worker 路由见 wrangler.toml。AUTHOR_KEY 与 GITHUB_TOKEN 只能存为 Secret；前端不携带 GitHub/Cloudflare token。
- GitHub fine-grained token 仅授权此仓库，Contents read/write；记录到期日并在到期前替换。
- 默认 30 天会话，SQLite Durable Object 记录撤销。退出会立即使原 Cookie 失效；更换 AUTHOR_KEY 会使全部旧签名失效。不要删除 SessionStore migration 或 namespace 来模拟退出。
- 完整 WebP 解码在 Durable Object 执行，适合当前免费计划 CPU 限额；无需升级套餐。图片、正文和密钥不进入会话数据库。
- CSP 禁止 unsafe-inline/eval。公开页面通过区级响应头转换规则，为 Cloudflare 检测脚本生成每次请求独立的 nonce（`uuidv4(cf.random_seed)`）；其他来源不能借此执行 inline 脚本。公开主站不使用 no-transform，避免阻断自动统计；写作/API 和 pages.dev 仍保留 no-transform。保留 WAF，不以伪造 User-Agent 证明机器人可访问。
- 响应头规则 `yuki.art public CSP with per-request nonce` 只覆盖主站公开页面（`/`、`/about/`、`/p/*`），不覆盖写作/API。更改源站 CSP 时必须同步更新区级表达式；删除该规则前先恢复公开页面 no-transform，否则检测脚本会被 CSP 拦截。验证不同请求 nonce 不同，且实际注入脚本使用相同 nonce。
- Cloudflare 最终安全头可能被区级规则覆盖，必须检查线上结果。HSTS 先用一天，不默认 includeSubDomains/preload。
- 自动统计仍沿用 Cloudflare Web Analytics 的地区排除设置；检查 beacon 是否能正常加载，不擅自扩大统计地区。

## 回退与备份

- 修改前保留完整 Git 仓库或创建离线 `git bundle create <安全位置>/yuki-art.bundle --all`，内容和图片都在 Git 中。用另一个临时目录 `git clone <bundle>` 后构建，以核对备份可恢复。
- 删除公开文章不会移除历史版本。若误传私人内容或密钥，应立即撤销密钥并单独处理历史清除；普通回退不能让已泄露数据消失。
- 网页回退优先在 Pages 选择上一个成功生产版本；仓库随后用新的 revert 提交修正，不 force push，不 reset 已发布历史。
- Worker 回退优先使用 Cloudflare 版本回退；保留同一 SessionStore class/binding/migration，避免数据库迁移与旧代码不兼容。严重发布错误先暂停作者操作，保留草稿和提交证据。
- GitHub、Cloudflare 设置和 Secrets 的恢复依据应保存在私人密码管理器中，不放公开仓库。会话账本丢失时要求重新登录，不恢复旧会话。

## 平台卡片与 SEO

逐层检查：真实 SSR 元信息 → 图片状态/MIME/尺寸 → robots 与 WAF 的实际请求记录 → X/TG 客户端最终卡片。curl 携带 Twitterbot/TelegramBot 字样只能检查普通请求，不能证明平台抓取成功。不要为测试卡片自动发推或发消息。Google 收录和 AI 引用没有保证；结构化数据仅描述真实作者和当前内容。

没有新的定时任务。需要以后巡检时，再由作者明确启用。
