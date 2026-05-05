# 🔄 ShiftSwap Bot

An AI-powered Slack bot that finds shift replacements automatically. An employee messages the bot, and it DMs teammates one by one until someone accepts — then notifies the original requester.

---

## How It Works

```
Employee → DMs bot with shift details
    ↓
Claude parses the request (date, time, role, reason)
    ↓
Bot fetches all workspace members
    ↓
Bot DMs Teammate #1 with Accept/Decline buttons
    ↓ (if declined)
Bot DMs Teammate #2 … and so on
    ↓ (when accepted)
Bot notifies the original requester ✅
```

---

## Setup

### 1. Create a Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps) and click **Create New App → From scratch**
2. Name it **ShiftSwap Bot** and pick your workspace

### 2. Configure OAuth Scopes

Under **OAuth & Permissions → Bot Token Scopes**, add:

| Scope | Purpose |
|-------|---------|
| `chat:write` | Send messages |
| `im:write` | Open DM channels |
| `im:read` | Read DMs |
| `im:history` | Read DM history |
| `users:read` | Fetch team members |
| `channels:read` | Read channel info |
| `mpim:write` | Open group DMs if needed |

### 3. Enable Socket Mode

1. Go to **Socket Mode** in the sidebar → Enable it
2. Create an **App-Level Token** with scope `connections:write`
3. Copy the token — it starts with `xapp-`

### 4. Enable Event Subscriptions

Under **Event Subscriptions**:
1. Toggle **Enable Events** on
2. Under **Subscribe to bot events**, add: `message.im`

### 5. Enable Interactivity

Under **Interactivity & Shortcuts**:
1. Toggle **Interactivity** on
2. (In Socket Mode, no Request URL is needed)

### 6. Install the App

Go to **Install App** → **Install to Workspace** → Authorize it.

Copy your **Bot User OAuth Token** (starts with `xoxb-`) and **Signing Secret** (under Basic Information).

---

## Installation

```bash
# Clone or copy the project
cd shiftswap-bot

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and fill in your tokens
```

Your `.env` should look like:
```
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_APP_TOKEN=xapp-...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Running the Bot

```bash
# Production
npm start

# Development (auto-restarts on file changes)
npm run dev
```

You should see:
```
⚡️ ShiftSwap Bot is running!
```

---

## Usage

Any team member can DM the bot directly in Slack:

> **"Hey, I need someone to cover my shift this Saturday June 14 from 8am to 4pm. I'm a cashier and have a family event."**

The bot will:
1. Confirm it understood the request
2. Start DMing teammates one by one
3. Keep the requester updated on who was asked
4. Send a confirmation when someone accepts

---

## File Structure

```
shiftswap-bot/
├── app.js          # Slack Bolt entry point, event routing
├── agent.js        # Claude AI logic + full shift replacement flow
├── db.js           # In-memory state store for active requests
├── package.json
├── .env.example
└── README.md
```

---

## Production Considerations

### Replace the in-memory store
`db.js` uses a `Map()` which resets on restart. For production, swap it with:
- **Redis** (recommended for simplicity)
- **PostgreSQL / SQLite**
- **Firebase / Supabase**

### Deploy the bot
Since it uses Socket Mode, no public URL is needed. You can run it on:
- A small **VPS** (DigitalOcean Droplet, Hetzner, etc.)
- **Railway**, **Render**, or **Fly.io** (free tiers work)
- A **Raspberry Pi** on your office network

### Smarter candidate ordering
Currently candidates are randomized for fairness. You could improve this by:
- Prioritizing employees with the same role
- Prioritizing by availability (integrate with a scheduling system)
- Tracking who covers shifts most often and rotating fairly

### Rate limiting
Slack has rate limits on DMs. If you have a very large team, add a small delay between `askCandidate` calls (e.g. `setTimeout` of 1–2 seconds).

---

## Environment Variables

| Variable | Where to find it |
|----------|-----------------|
| `SLACK_BOT_TOKEN` | Slack App → OAuth & Permissions |
| `SLACK_SIGNING_SECRET` | Slack App → Basic Information |
| `SLACK_APP_TOKEN` | Slack App → Socket Mode (App-Level Token) |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com |
