# 🏗️ Moodioos Architecture

This document describes the architectural decisions, patterns, and structure of the Moodioos Discord bot.

## 📐 Architecture Overview

Moodioos follows a **modular, layered architecture** based on the Discord-TemplateBot from BotDiscordFactory, adapted for wellness and motivation features.

```
┌─────────────────────────────────────────────────┐
│          Discord API (Gateway + REST)           │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│           BotClient (client.ts)                 │
│  • Custom Discord.js Client                     │
│  • Command Registry (Collection)                │
│  • Event Handlers                               │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼──────┐   ┌────────▼──────────┐
│   Commands   │   │   Fastify API     │
│   System     │   │   Server          │
└──────────────┘   └───────────────────┘
        │                   │
┌───────▼──────────────────▼──────────┐
│        Data Layer                   │
│  • JSON Files (current)             │
│  • Supabase PostgreSQL (future)     │
└─────────────────────────────────────┘
```

## 🔧 Core Components

### 1. **BotClient** (`src/client.ts`)

Custom Discord.js client extending the base `Client` class.

**Responsibilities:**
- Manage Discord gateway connection
- Register and store commands in `Collection<string, Command>`
- Handle interaction events
- Provide bot statistics

**Key Methods:**
- `registerCommands()` - Load commands from registry
- `setupListeners()` - Set up Discord event handlers
- `start()` - Connect to Discord
- `getStatistics()` - Return bot metrics

**Design Pattern:** Singleton (only one bot instance)

### 2. **Command System** (`src/commands/`)

All slash commands follow the `Command` interface pattern.

**Command Interface:**
```typescript
interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
```

**Commands:**
- **`mood.ts`** - Main wellness command with subcommands
  - `want` - Get compliments or music
  - `music` - Music recommendations
  - `say` - Special messages (love)
  - `join` - Join voice channel
- **`hug.ts`** - Send hugs to users
- **`stats.ts`** - Bot statistics
- **`help.ts`** - Help and commands list
- **`ping.ts`** - Health check command

**Design Pattern:** Command Pattern (encapsulate requests as objects)

### 3. **API Server** (`src/api/`)

Fastify-based REST API for monitoring and observability.

**Routes:**
- `GET /health` - Health check (bot status, uptime, ping)
- `GET /stats` - Bot statistics (guilds, users, commands)
- `GET /docs` - Swagger UI documentation

**Plugin Registration Order (STRICT):**
1. CORS
2. Swagger
3. Swagger UI
4. Bot Routes

**Purpose:**
- Keep API running even if bot crashes
- Enable monitoring (UptimeRobot, OnRender dashboard)
- Provide statistics for future dashboard

### 4. **Data Layer** (`src/data/`)

Currently JSON-based, future PostgreSQL migration planned.

**Current Storage:**
- `compliments.json` - Motivational messages
- `music-recommendations.json` - Music suggestions with metadata
- `hug-gifs.json` - Hug GIF URLs

**Future Database Schema** (Supabase):
- `users` - Discord user info
- `moods_history` - Interaction logs
- `user_preferences` - User settings
- `guild_statistics` - Per-server stats
- `daily_stats` - Bot-wide daily metrics

See `migrations/001_init.sql` for full schema.

### 5. **Configuration** (`src/config.ts`)

Centralized environment configuration using `dotenv`.

**Required Variables:**
- `DISCORD_TOKEN` - Bot token
- `DISCORD_APPLICATION_ID` - Application ID
- `DISCORD_GUILD_ID` - (Optional) Dev guild for fast command deployment
- `PORT` - API server port
- `NODE_ENV` - Environment (development/production)

**Path Resolution:**
```typescript
dotenv.config({ path: path.resolve(__dirname, '../.env') });
```

**CRITICAL:** Always use `__dirname`, never `process.cwd()`

## 🔄 Bootstrap Sequence

**STRICT ORDER** (defined in `src/index.ts`):

```typescript
// 1. Start Internal API Server
await createApiServer();

// 2. Start Discord Bot
await bot.start();
```

**Reason:** If the bot crashes, the API remains accessible for health checks and debugging.

**Error Handling:** All top-level errors call `process.exit(1)` - no zombie states.

## 🎯 Discord.js v14 Patterns

### Intents Configuration

```typescript
intents: [
  GatewayIntentBits.Guilds,          // Guild info
  GatewayIntentBits.MessageContent,  // DM replies
  GatewayIntentBits.GuildVoiceStates, // Voice join
  GatewayIntentBits.DirectMessages,  // DM functionality
]
```

**IMPORTANT:** These intents must be enabled in Discord Developer Portal.

### Slash Commands - Two-Step Process

**Step 1:** Define command in `src/commands/{name}.ts`
**Step 2:** Deploy to Discord API via `deploy-commands.ts`

**CRITICAL:** Forgetting Step 2 = command invisible in Discord.

### Interaction Responses

**Fast operations (<3s):**
```typescript
await interaction.reply({ content: 'Response' });
```

**Slow operations (>3s):**
```typescript
await interaction.deferReply();
// ... long operation ...
await interaction.editReply({ content: 'Result' });
```

**RULE:** Always reply or defer within 3 seconds.

## 🧪 Testing Strategy

**Framework:** Vitest (TypeScript-native, ESM support)

**Test Coverage:**
- [ ] Unit tests for each command
- [ ] API route tests (/health, /stats)
- [ ] Bootstrap sequence test
- [ ] Mock Discord.js interactions

**Location:** `src/commands/__tests__/{command}.test.ts`

**TODO:** Implement comprehensive test suite (see todo #7)

## 🚀 Deployment Architecture

### OnRender Free Tier

**Constraints:**
- Cold starts after inactivity (~30s wake-up)
- Ephemeral filesystem (no persistent storage)

**Solutions:**
- UptimeRobot pings `/health` every 10 minutes
- Use Supabase for persistent data (future)

**Environment:**
- Node.js 18+
- pnpm package manager
- Build: `pnpm install && pnpm run build`
- Start: `pnpm start`

### Future: DiscordBotFactory Dashboard

Centralized monitoring for all bots in BotDiscordFactory:
- View health status of all bots
- Aggregate statistics
- Deploy commands across bots
- Manage configurations

## 📦 Dependencies

### Core
- **discord.js** (^14.25.1) - Discord API wrapper
- **fastify** (^5.x) - Web framework
- **dotenv** (^16.x) - Environment config

### Fastify Plugins
- **@fastify/swagger** - API documentation
- **@fastify/swagger-ui** - Interactive docs
- **@fastify/cors** - CORS support

### Dev Dependencies
- **typescript** (^5.3) - Type safety
- **tsx** - TypeScript execution
- **vitest** - Testing framework
- **eslint** - Linting
- **prettier** - Code formatting

### Future Dependencies (Database Migration)
- **@supabase/supabase-js** - Supabase client
- **drizzle-orm** (optional) - Type-safe ORM

## 🎨 Design Patterns

1. **Singleton Pattern** - BotClient instance
2. **Command Pattern** - Slash commands
3. **Observer Pattern** - Discord event listeners
4. **Plugin Pattern** - Fastify route registration
5. **Repository Pattern** (future) - Database access layer

## 📁 File Structure Conventions

**Naming:**
- Files: `kebab-case` (e.g., `deploy-commands.ts`)
- Classes: `PascalCase` (e.g., `BotClient`)
- Functions/Variables: `camelCase` (e.g., `registerCommands`)

**Exports:**
- Commands: Named exports in `commands/index.ts`
- Modules: Default export allowed elsewhere

**Import Order:**
```typescript
// 1. External dependencies
import { Client } from 'discord.js';

// 2. Internal modules
import { config } from './config.js';

// 3. Relative imports
import { myHelper } from '../utils/helper.js';
```

## ⚠️ Anti-Patterns to Avoid

1. ❌ **Starting bot before API** → Loss of observability
2. ❌ **Using `process.cwd()` for paths** → Context-dependent breaks
3. ❌ **Forgetting to deploy commands** → Invisible commands
4. ❌ **Reply after 3s without defer** → Interaction failed
5. ❌ **Inverting Fastify plugin order** → Broken features
6. ❌ **Using `any` type** → Loss of type safety

## 🔮 Future Enhancements

### Phase 2: Database Integration
- Supabase PostgreSQL setup
- User mood history tracking
- Personalized recommendations
- Guild analytics dashboard

### Phase 3: Advanced Features
- Voice playback (MP3 for `/mood say:love`)
- Periodic motivational DMs (opt-in)
- Multi-language support (i18n)
- Custom compliments per guild

### Phase 4: DiscordBotFactory Integration
- Centralized dashboard
- Cross-bot statistics
- Unified deployment pipeline
- Shared services (auth, logging)

## 📚 References

- [Discord.js v14 Documentation](https://discord.js.org/)
- [Fastify Documentation](https://www.fastify.io/)
- [Supabase Documentation](https://supabase.com/docs)
- [BotDiscordFactory Standards](../../bmad/_bmad/bmm/data/discord-bot-factory-standards.md)

---

**Last Updated:** 2026-01-06  
**Status:** ✅ Production Ready (v1.0 - JSON-based)
