const webhookUrl = process.env.WECHAT_WEBHOOK_URL;
const reminderMessage = "下班打卡提醒：别忘了打卡下班。";

function getBeijingParts(date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
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
    weekday: parts.weekday,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function isMondayToSaturday(weekday) {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].includes(weekday);
}

function isReminderWindow({ weekday, hour, minute }) {
  return isMondayToSaturday(weekday) && hour === 18 && minute >= 0 && minute <= 20;
}

function isManualTest(event) {
  if (!event) {
    return false;
  }

  if (event.forceSend === true || event.test === true) {
    return true;
  }

  if (typeof event.Message === "string") {
    return event.Message.toLowerCase().includes("test");
  }

  return false;
}

async function sendMarkdownMessage() {
  if (!webhookUrl) {
    throw new Error("Missing WECHAT_WEBHOOK_URL environment variable.");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      msgtype: "markdown",
      markdown: {
        content: reminderMessage,
      },
    }),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Webhook request failed with ${response.status}: ${text}`);
  }

  const result = JSON.parse(text);

  if (result.errcode !== 0) {
    throw new Error(`WeCom webhook failed: ${text}`);
  }
}

exports.main = async (event = {}) => {
  const beijingTime = getBeijingParts(new Date());
  const manualTest = isManualTest(event);

  if (!manualTest && !isReminderWindow(beijingTime)) {
    const minute = String(beijingTime.minute).padStart(2, "0");
    const second = String(beijingTime.second).padStart(2, "0");
    const current = `${beijingTime.date} ${beijingTime.hour}:${minute}:${second}`;
    console.log(`Skipped: Beijing time ${current} is outside the reminder window.`);

    return {
      skipped: true,
      reason: "outside_reminder_window",
      beijingTime,
    };
  }

  await sendMarkdownMessage();

  return {
    sent: true,
    beijingTime,
    manualTest,
  };
};
