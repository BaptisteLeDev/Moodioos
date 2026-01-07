# 🌟 Moodioos - Discord Wellness & Motivation Bot

> Spread positivity, good vibes, and warm hugs across your Discord community! 💕

Moodioos is a Discord bot designed to promote wellness, motivation, and positive interactions in your server. Get random compliments, music recommendations, send hugs, and enjoy wholesome features that keep your community in a good mood.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Discord.js](https://img.shields.io/badge/Discord.js-14.25.1-5865F2)
![Fastify](https://img.shields.io/badge/Fastify-5.x-000000)

## ✨ Features

### 🎯 Core Commands

#### `/mood` - Your Wellness Hub
- **`/mood want <type>`** - Get motivational content
  - `compliment` - Receive a random motivational message
  - `music` - Get a music recommendation
  
- **`/mood music [genre]`** - Music recommendations
  - 🎧 Lofi Hip Hop
  - 🎺 Lo-Fi Jazz
  - 🎵 Indie Pop
  - More genres coming soon!

- **`/mood say <message>`** - Make the bot say something special
  - `love` - "Je t'aime" message 💕

- **`/mood join`** - Make bot join your voice channel

#### `/hug @user` - Spread the Love
Send a warm hug with a cute GIF to someone special in your server. Self-hugs are welcome too! 🤗

#### `/stats` - Bot Statistics
View bot performance metrics:
- Number of servers
- User count
- Uptime
- Bot impact across communities

#### `/help` - Get Help
Display all available commands and how to use them.

### 🔌 API Endpoints

Moodioos includes a Fastify API server for monitoring and statistics:

- **`GET /health`** - Health check endpoint
  - Bot connection status
  - Uptime
  - WebSocket ping

- **`GET /stats`** - Detailed bot statistics
  - Guild count
  - User count
  - Command count
  - Uptime metrics

- **`GET /docs`** - Interactive Swagger documentation

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.0.0
- [pnpm](https://pnpm.io/) >= 8.0.0
- Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications))

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YourUsername/BotDiscordFactory.git
   cd BotDiscordFactory/bot/Moodioos
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Discord credentials:
   ```env
   # Discord Configuration
   DISCORD_TOKEN=your_bot_token_here
   DISCORD_APPLICATION_ID=your_application_id_here
   DISCORD_GUILD_ID=your_guild_id_for_dev_commands (optional)

   # API Server
   PORT=3000

   # Environment
   NODE_ENV=development
   ```

4. **Deploy commands to Discord**:
   ```bash
   pnpm run deploy
   ```

5. **Start the bot**:
   ```bash
   # Development (with hot reload)
   pnpm run dev

   # Production
   pnpm run build
   pnpm start
   ```

## 📁 Project Structure

```
Moodioos/
├── src/
│   ├── api/                    # Fastify API server
│   │   ├── server.ts          # API server setup
│   │   └── bot.api.ts         # Bot routes (/health, /stats)
│   ├── commands/              # Discord slash commands
│   │   ├── mood.ts            # /mood command
│   │   ├── hug.ts             # /hug command
│   │   ├── help.ts            # /help command
│   │   ├── stats.ts           # /stats command
│   │   ├── ping.ts            # /ping command
│   │   ├── types.ts           # Command type definitions
│   │   └── index.ts           # Command registry
│   ├── data/                  # JSON data storage
│   │   ├── compliments.json   # Motivational messages
│   │   ├── music-recommendations.json
│   │   └── hug-gifs.json      # Hug GIF URLs
│   ├── assets/
│   │   └── sounds/            # MP3 files (for voice features)
│   ├── types/                 # Global TypeScript types
│   ├── client.ts              # Custom Discord client
│   ├── config.ts              # Environment configuration
│   ├── index.ts               # Bot entry point
│   └── deploy-commands.ts     # Command deployment script
├── migrations/                # Database migration files
│   ├── 001_init.sql          # Initial schema (Supabase)
│   └── README.md             # Migration guide
├── .env.example              # Environment template
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## 🛠️ Development

### Available Scripts

```bash
# Development with hot reload
pnpm run dev

# Build for production
pnpm run build

# Start production build
pnpm start

# Deploy commands (dev guild only)
pnpm run deploy:dev

# Deploy commands (global)
pnpm run deploy:prod

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Lint code
pnpm run lint

# Format code
pnpm run format

# Type check
pnpm run type-check

# Validate all (type-check + lint + format + test)
pnpm run validate
```

### Adding New Commands

1. **Create command file** in `src/commands/`:
   ```typescript
   // src/commands/my-command.ts
   import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
   import { Command } from './types.js';

   export const myCommand: Command = {
     data: new SlashCommandBuilder()
       .setName('my-command')
       .setDescription('Description here'),
     
     async execute(interaction: ChatInputCommandInteraction) {
       await interaction.reply('Hello!');
     },
   };
   ```

2. **Export command** in `src/commands/index.ts`:
   ```typescript
   export { myCommand } from './my-command.js';
   // Add to commands array
   export const commands: Command[] = [..., myCommand];
   ```

3. **Deploy commands**:
   ```bash
   pnpm run deploy
   ```

## 🌐 Deployment

### OnRender (Recommended for Free Tier)

1. **Create a new Web Service** on [Render](https://render.com)

2. **Connect your repository**

3. **Configure build settings**:
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm start`

4. **Add environment variables**:
   - `DISCORD_TOKEN`
   - `DISCORD_APPLICATION_ID`
   - `PORT` (3000)
   - `NODE_ENV` (production)

5. **Setup keep-alive** (prevent cold starts):
   - Use [UptimeRobot](https://uptimerobot.com) to ping `/health` every 10 minutes

### Docker (Optional)

```bash
# Build image
docker build -t moodioos .

# Run container
docker run -d --env-file .env -p 3000:3000 moodioos
```

## 📊 Database Migration (Future)

Moodioos currently uses JSON files for data storage. For persistent storage and analytics:

1. **Setup Supabase**:
   - Create project at [supabase.com](https://supabase.com)
   - Run `migrations/001_init.sql` in SQL Editor

2. **Add environment variables**:
   ```env
   SUPABASE_URL=https://[PROJECT-REF].supabase.co
   SUPABASE_SERVICE_KEY=your_service_key_here
   ```

3. **Install dependencies**:
   ```bash
   pnpm add @supabase/supabase-js
   ```

See `migrations/README.md` for full migration guide.

## 🔒 Required Discord Bot Permissions

When inviting Moodioos to your server, ensure these permissions:

- **Text Permissions**:
  - Send Messages
  - Embed Links
  - Read Message History

- **Voice Permissions** (for `/mood join` and voice features):
  - Connect
  - Speak

**OAuth2 Scopes**: `bot`, `applications.commands`

**Permission Integer**: `3165184` (adjust as needed)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting: `pnpm run validate`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💖 Support

If Moodioos brings positivity to your community:

- ⭐ Star the repository
- 🐛 Report bugs via [Issues](https://github.com/YourUsername/BotDiscordFactory/issues)
- 💡 Suggest features
- 🤗 Share with other communities!

## 🔗 Links

- [Discord Developer Portal](https://discord.com/developers/applications)
- [Discord.js Documentation](https://discord.js.org/)
- [Fastify Documentation](https://www.fastify.io/)
- [Supabase Documentation](https://supabase.com/docs)

---

**Made with 💕 for positive Discord communities**

*Part of the [BotDiscordFactory](../../README.md) project*
