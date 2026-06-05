const REMINDER_MESSAGE =
  "\u4e0b\u73ed\u6253\u5361\u63d0\u9192\uff1a\u522b\u5fd8\u4e86\u6253\u5361\u4e0b\u73ed\u3002";

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

async function sendWeComMarkdown(env) {
  if (!env.WECHAT_WEBHOOK_URL) {
    throw new Error("Missing WECHAT_WEBHOOK_URL secret.");
  }

  const response = await fetch(env.WECHAT_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      msgtype: "markdown",
      markdown: {
        content: REMINDER_MESSAGE,
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

async function runReminder(env, { force = false } = {}) {
  const beijingTime = getBeijingParts(new Date());

  if (!force && !isReminderWindow(beijingTime)) {
    return {
      skipped: true,
      reason: "outside_reminder_window",
      beijingTime,
    };
  }

  await sendWeComMarkdown(env);

  return {
    sent: true,
    beijingTime,
    force,
  };
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runReminder(env));
  },

  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/test") {
      if (!env.TEST_TOKEN || url.searchParams.get("token") !== env.TEST_TOKEN) {
        return new Response("Unauthorized", { status: 401 });
      }

      const result = await runReminder(env, { force: true });
      return Response.json(result);
    }

    return Response.json({
      ok: true,
      message: "Clock-out reminder worker is deployed.",
      test: "Set TEST_TOKEN secret and visit /test?token=YOUR_TOKEN to send a manual test.",
    });
  },
};
