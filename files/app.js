const { App } = require("@slack/bolt");
const { handleMessage } = require("./agent");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

// All DMs — both shift requests and candidate replies — flow through handleMessage.
// The agent figures out who is talking and what context they're in.
app.message(async ({ message, say, client }) => {
  if (message.channel_type !== "im") return; // Only handle DMs
  if (message.bot_id) return;               // Ignore bot messages
  if (!message.user) return;                // Ignore system messages

  await handleMessage({ message, say, client });
});

(async () => {
  await app.start();
  console.log("⚡️ ShiftSwap Bot is running!");
})();
