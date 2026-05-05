# 🔄 ShiftSwap Bot — Multi-Workspace

Any Slack team can install this bot with one click. Each workspace gets its own isolated bot experience — shift requests, conversations, and tokens never mix between teams.

---

## How it works (for end users)

1. Someone DMs the bot: _"I need someone to cover my Saturday 9am–5pm shift"_
2. Bot asks who to reach out to: _"Who should I contact? Just type their names."_
3. Employee replies: _"Alex, Jordan, Sam"_
4. Bot DMs Alex. If Alex declines, it DMs Jordan. And so on.
5. When someone accepts, the original employee gets notified.

Every conversation is fully AI-driven — the bot talks like a real person, handles follow-up questions, and reads natural yes/no signals.

---

## Architecture

```
Any browser  ──── GET /                    ──▶  Install landing page
Slack        ──── GET /slack/oauth_redirect ──▶  OAuth callback → saves bot token
Slack        ──── POST /slack/events        ──▶  DM events → agent.js
```

**Key files:**
```
app.js      Bolt HTTP server, OAuth flow, event routing
agent.js    Claude AI logic — parses requests, runs conversations
db.js       Per-team shift request state (scoped by teamId)
store.js    Per-team bot token storage (scoped by teamId)
```

---

## Setup

### 1. Create a Slack App

Go to [https://api.slack.com/apps](https://api.slack.com/apps) → **Create New App → From scratch**

### 2. Configure OAuth & Permissions

Under **OAuth & Permissions → Redirect URLs**, add:
```
https://your-app-url.com/slack/oauth_redirect
```

Under **Bot Token Scopes**, add:
| Scope | Purpose |
|-------|---------|
| `chat:write` | Send messages |
| `im:write` | Open DMs |
| `im:read` | Read DMs |
| `im:history` | Read DM history |
| `users:read` | Fetch team members |
| `channels:read` | Read channel info |
| `mpim:write` | Open group DMs |

### 3. Enable Event Subscriptions

Under **Event Subscriptions**:
1. Toggle **Enable Events** on
2. Set Request URL to: `https://your-app-url.com/slack/events`
3. Under **Subscribe to bot events**, add: `message.im`

> Slack will send a verification request to this URL — your server must be running and publicly accessible for it to verify.

### 4. Get your credentials

From **Basic Information**, copy:
- **Client ID**
- **Client Secret**
- **Signing Secret**

### 5. Deploy the app

The bot needs a **public HTTPS URL** — unlike the v1 Socket Mode version, it can't run on a laptop.

**Recommended: Railway (free tier works)**
1. Push code to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add environment variables (see below)
4. Copy the generated URL (e.g. `https://shiftswap.up.railway.app`)

**Other options:** Render, Fly.io, Heroku, any VPS with a domain + SSL

### 6. Set environment variables

```
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...
SLACK_SIGNING_SECRET=...
SLACK_STATE_SECRET=<random 32+ char string>
APP_URL=https://your-app-url.com
ANTHROPIC_API_KEY=sk-ant-...
PORT=3000
```

Generate a state secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 7. Run it

```bash
npm install
npm start
```

---

## Installing to a workspace

Anyone can install the bot by visiting:
```
https://your-app-url.com
```

They'll see a landing page with an **"Add to Slack"** button. After clicking Allow, the bot is live in their workspace instantly.

You can also submit the app to the **Slack App Directory** to make it publicly discoverable — but a direct link works fine for sharing with specific teams.

---

## Production: Persist tokens across restarts

`store.js` uses an in-memory `Map` by default — tokens are lost if the server restarts. For production, swap it with a real database. The interface is simple:

```js
// store.js — swap these three functions with DB calls

function saveInstallation(installation) { /* INSERT */ }
function getInstallation(teamId)        { /* SELECT */ }
function deleteInstallation(teamId)     { /* DELETE */ }
```

**Redis example:**
```js
const redis = require("redis");
const client = redis.createClient({ url: process.env.REDIS_URL });

async function saveInstallation(installation) {
  await client.set(`install:${installation.teamId}`, JSON.stringify(installation));
}
async function getInstallation(teamId) {
  const data = await client.get(`install:${teamId}`);
  return data ? JSON.parse(data) : null;
}
```

Same pattern works for Postgres, DynamoDB, Supabase, etc.

---

## Local development with ngrok

```bash
# Terminal 1 — run the bot
npm run dev

# Terminal 2 — expose it publicly
ngrok http 3000
```

Copy the `https://abc123.ngrok.io` URL and:
- Set `APP_URL=https://abc123.ngrok.io` in your `.env`
- Update the Redirect URL and Event Subscriptions Request URL in your Slack app settings

Note: ngrok URL changes every restart on the free tier, so you'll need to update Slack each time. A paid ngrok plan with a fixed domain avoids this.
