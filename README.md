# 企业微信群下班打卡提醒

推荐使用 [Cloudflare Workers 方案](cloudflare/README.md)。GitHub Actions 的定时任务曾经出现严重延迟，不适合作为重要打卡提醒的主方案；腾讯云不可用时，Cloudflare Workers Cron 是更合适的替代方案。

Cloudflare Workers 方案会在周一到周六北京时间 18:05 通过企业微信群机器人 Webhook 发送 markdown 提醒：

> 下班打卡提醒：别忘了打卡下班。

Webhook 地址从 Worker Secret `WECHAT_WEBHOOK_URL` 读取，不会写进代码。

## 配置企业微信群机器人

1. 打开企业微信群，点击右上角群设置。
2. 选择「群机器人」或「添加机器人」。
3. 添加「自定义机器人」。
4. 复制机器人生成的 Webhook 地址。

请不要把 Webhook 地址提交到仓库。

## Cloudflare 部署

完整步骤见 [cloudflare/README.md](cloudflare/README.md)。

核心配置：

- Worker Secret：`WECHAT_WEBHOOK_URL`
- 定时触发器 Cron：`5 10 * * MON-SAT`
- 可选测试 Secret：`TEST_TOKEN`

## 定时规则

Cloudflare Workers Cron Triggers 使用 UTC 时间。

周一到周六每天 18:05：

```text
5 10 * * MON-SAT
```

Worker 代码里还有一层北京时间保护：只有周一到周六北京时间 18:00-18:20 之间才会发送，避免误触发。

## GitHub Actions

仓库里的 GitHub Actions 现在只保留手动测试入口，不再自动定时发送，避免出现延迟后乱发。

## 备用方案

如果你之后可以使用腾讯云，也可以参考 [腾讯云 SCF 方案](scf/README.md)。
