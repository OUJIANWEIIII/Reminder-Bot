# Cloudflare Workers 下班打卡提醒

这是不依赖腾讯云的可靠定时方案。Cloudflare Workers Cron Triggers 使用 UTC 时间；北京时间 18:05 等于 UTC 10:05，所以周一到周六 18:05 的 cron 是：

```text
5 10 * * MON-SAT
```

官方文档：

- Cron Triggers: https://developers.cloudflare.com/workers/configuration/cron-triggers/
- Secrets: https://developers.cloudflare.com/workers/configuration/secrets/

## 创建 Worker

1. 打开 Cloudflare Dashboard。
2. 进入 `Workers & Pages`。
3. 创建一个 Worker，名称建议为 `wechat-clock-out-reminder`。
4. 把 `src/index.js` 的内容复制到 Worker 代码编辑器。
5. 保存并部署。

## 配置 Secret

在 Worker 的设置里添加 Secret：

```text
WECHAT_WEBHOOK_URL=你的企业微信群机器人 Webhook
```

不要把 Webhook 写进代码，也不要提交到仓库。

如果想通过浏览器手动测试，再添加一个 Secret：

```text
TEST_TOKEN=任意一段你自己知道的随机字符串
```

然后访问：

```text
https://你的-worker地址.workers.dev/test?token=你的TEST_TOKEN
```

## 配置定时触发器

在 Worker 的 `Settings` 或 `Triggers` 中添加 Cron Trigger：

```text
5 10 * * MON-SAT
```

这表示 UTC 周一到周六 10:05，即北京时间周一到周六 18:05。

代码里还有一层北京时间保护：只有周一到周六 18:00-18:20 才会发送。这样即使误触发，也不会早上或半夜乱发。
