# 🚀 Moodioos - Quick Start Guide

Get Moodioos up and running in 5 minutes!

## Prerequisites Check

Before starting, ensure you have:

- ✅ **Node.js >= 20.0.0** 
  ```bash
  node --version  # Should show v20.x.x or higher
  ```
  
- ✅ **pnpm >= 8.0.0**
  ```bash
  pnpm --version  # Should show 8.x.x or higher
  ```
  If not installed: `npm install -g pnpm`

- ✅ **Discord Bot Token** from [Discord Developer Portal](https://discord.com/developers/applications)

## Setup Steps

### 1. Install Dependencies

```bash
cd bot/Moodioos
pnpm install
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env
```

Edit `.env` and add your Discord credentials:

```env
DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE
DISCORD_APPLICATION_ID=YOUR_APP_ID_HERE
DISCORD_GUILD_ID=YOUR_DEV_GUILD_ID  # Optional for faster testing
PORT=3000
NODE_ENV=development
```

### 3. Deploy Commands to Discord

```bash
# Deploy to specific guild (instant, recommended for dev)
pnpm run deploy:dev

# OR deploy globally (takes up to 1 hour)
pnpm run deploy:prod
```

### 4. Start the Bot

```bash
# Development mode (with hot reload)
pnpm run dev

# Production mode
pnpm run build
pnpm start
```

## Verify Installation

### Test Bot Commands

In Discord, try these commands:

- `/ping` - Should respond with "Pong! 🏓"
- `/help` - Shows all available commands
- `/mood want compliment` - Get a motivational message
- `/hug @someone` - Send a hug (mention a user)

### Test API Endpoints

Open browser and visit:

- **Health Check**: http://localhost:3000/website/health
- **Bot Stats**: http://localhost:3000/website/stats
- **Swagger Docs**: http://localhost:3000/docs

## Troubleshooting

### Problem: "Unsupported environment (bad Node.js version)"

**Solution**: Update to Node.js 20+

```bash
# Using nvm (recommended)
nvm install 20
nvm use 20

# Or download from https://nodejs.org/
```

### Problem: "tsc not recognized"

**Solution**: Install dependencies first

```bash
pnpm install
```

### Problem: Commands not showing in Discord

**Solution**: Deploy commands again

```bash
pnpm run deploy:dev
```

Wait a few seconds, then restart Discord client.

### Problem: "Invalid token" error

**Solution**: Check your `.env` file

1. Verify `DISCORD_TOKEN` is correct
2. Ensure no extra spaces or quotes
3. Get a new token from Discord Developer Portal if needed

### Problem: Bot goes offline immediately

**Solution**: Check console for errors

- Invalid token
- Missing intents in Discord Developer Portal
- Port already in use (change `PORT` in `.env`)

## Discord Developer Portal Setup

### Enable Required Intents

Go to your bot settings → Bot → Privileged Gateway Intents:

- ✅ **Presence Intent** (optional)
- ✅ **Server Members Intent** (optional)  
- ✅ **Message Content Intent** (required for DMs)

### Invite Bot to Server

1. Go to OAuth2 → URL Generator
2. Select scopes: `bot`, `applications.commands`
3. Select permissions:
   - Send Messages
   - Embed Links
   - Read Message History
   - Connect (voice)
   - Speak (voice)
4. Copy generated URL and open in browser
5. Select server and authorize

**Permission Integer**: `3165184`

## Next Steps

### Development

- **Add Commands**: Create files in `src/commands/`
- **Run Tests**: `pnpm test` (after implementing tests)
- **Lint Code**: `pnpm run lint`
- **Format Code**: `pnpm run format`

### Customization

- **Edit Compliments**: `src/data/compliments.json`
- **Edit Music Recs**: `src/data/music-recommendations.json`
- **Edit Hug GIFs**: `src/data/hug-gifs.json`

### Deployment

See [README.md](README.md#deployment) for:
- OnRender deployment guide
- Docker setup
- Environment variables for production

### Database Migration

See [migrations/README.md](migrations/README.md) for:
- Supabase setup
- Schema documentation
- Migration instructions

## Support

- 📖 **Full Documentation**: [README.md](README.md)
- 🏗️ **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
- 🐛 **Issues**: [GitHub Issues](https://github.com/YourUsername/BotDiscordFactory/issues)

---

**Status**: Ready to develop! 🎉  
**Estimated Setup Time**: 5-10 minutes
