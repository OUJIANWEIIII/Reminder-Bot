const webhookUrl = process.env.WECHAT_WEBHOOK_URL;

if (!webhookUrl) {
  throw new Error("Missing WECHAT_WEBHOOK_URL. Add it in GitHub repository Secrets.");
}

const payload = {
  msgtype: "markdown",
  markdown: {
    content: "\u4e0b\u73ed\u6253\u5361\u63d0\u9192\uff1a\u522b\u5fd8\u4e86\u6253\u5361\u4e0b\u73ed\u3002",
  },
};

async function main() {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Webhook request failed with ${response.status}: ${text}`);
  }

  let result;
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(`Webhook response is not valid JSON: ${text}`);
  }

  if (result.errcode !== 0) {
    throw new Error(`WeCom webhook failed: ${text}`);
  }

  console.log("Clock-out reminder sent.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
