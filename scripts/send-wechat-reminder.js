const fs = require("node:fs");
const path = require("node:path");

const webhookUrl = process.env.WECHAT_WEBHOOK_URL;
const eventName = process.env.GITHUB_EVENT_NAME;
const sentMarkerPath = process.env.SENT_MARKER_PATH;

if (!webhookUrl) {
  throw new Error("Missing WECHAT_WEBHOOK_URL. Add it in GitHub repository Secrets.");
}

function getBeijingParts(date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function isInReminderWindow({ hour, minute }) {
  return hour === 18 && minute >= 0 && minute <= 30;
}

function hasSentMarker() {
  return Boolean(sentMarkerPath && fs.existsSync(sentMarkerPath));
}

function writeSentMarker() {
  if (!sentMarkerPath) {
    return;
  }

  fs.mkdirSync(path.dirname(sentMarkerPath), { recursive: true });
  fs.writeFileSync(sentMarkerPath, new Date().toISOString(), "utf8");
}

const payload = {
  msgtype: "markdown",
  markdown: {
    content: "\u4e0b\u73ed\u6253\u5361\u63d0\u9192\uff1a\u522b\u5fd8\u4e86\u6253\u5361\u4e0b\u73ed\u3002",
  },
};

async function main() {
  const isManualRun = eventName === "workflow_dispatch";
  const beijingTime = getBeijingParts(new Date());

  if (!isManualRun && !isInReminderWindow(beijingTime)) {
    console.log(
      `Skipped: current Beijing time is ${beijingTime.date} ${beijingTime.hour}:${String(beijingTime.minute).padStart(2, "0")}:${String(beijingTime.second).padStart(2, "0")}, outside 18:00-18:30.`,
    );
    return;
  }

  if (!isManualRun && hasSentMarker()) {
    console.log(`Skipped: reminder already sent for ${beijingTime.date}.`);
    return;
  }

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

  if (!isManualRun) {
    writeSentMarker();
  }

  console.log("Clock-out reminder sent.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
