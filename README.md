# 企业微信群下班打卡提醒

这个项目使用 GitHub Actions 在工作日北京时间 18:05 自动通过企业微信群机器人 Webhook 发送 markdown 提醒：

> 下班打卡提醒：别忘了打卡下班。

Webhook 地址只从 GitHub Secrets 的 `WECHAT_WEBHOOK_URL` 读取，不会写进代码。

## 配置企业微信群机器人

1. 打开企业微信群，点击右上角群设置。
2. 选择「群机器人」或「添加机器人」。
3. 添加「自定义机器人」。
4. 复制机器人生成的 Webhook 地址。

Webhook 地址形如：

```text
https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

请不要把这个地址提交到仓库。

## 添加 GitHub Secret

1. 打开 GitHub 仓库页面。
2. 进入 `Settings` -> `Secrets and variables` -> `Actions`。
3. 点击 `New repository secret`。
4. `Name` 填写：

```text
WECHAT_WEBHOOK_URL
```

5. `Secret` 填写企业微信群机器人 Webhook 地址。
6. 保存后，GitHub Actions 会在运行时通过 `${{ secrets.WECHAT_WEBHOOK_URL }}` 读取。

## 定时规则

GitHub Actions 的 `schedule` 使用 UTC 时间。北京时间是 UTC+8，所以工作日北京时间 18:05 对应 UTC 10:05。

当前 workflow 配置在 [.github/workflows/workday-clock-out-reminder.yml](.github/workflows/workday-clock-out-reminder.yml)：

```yaml
schedule:
  - cron: "5 10 * * 1-5"
```

含义：

- `5`：第 5 分钟
- `10`：UTC 10 点，也就是北京时间 18 点
- `* *`：每天、每月
- `1-5`：周一到周五

## 修改提醒时间

修改 `.github/workflows/workday-clock-out-reminder.yml` 里的 cron 表达式即可。

例如要改成工作日北京时间 19:30：

1. 北京时间 19:30 减去 8 小时，得到 UTC 11:30。
2. 修改为：

```yaml
schedule:
  - cron: "30 11 * * 1-5"
```

## 手动测试

这个 workflow 支持 `workflow_dispatch` 手动触发。

1. 打开 GitHub 仓库的 `Actions` 页面。
2. 选择 `Workday Clock-out Reminder`。
3. 点击 `Run workflow`。

如果 Secret 配置正确，企业微信群会收到 markdown 消息。
