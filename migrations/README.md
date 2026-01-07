# Database Migration Guide - Moodioos

## Overview

This directory contains SQL migration files for transitioning Moodioos from JSON-based storage to a PostgreSQL database (via Supabase).

## Current State (v1.0)

- **Storage**: JSON files (`src/data/*.json`)
- **Data**: Compliments, music recommendations, hug GIFs
- **Persistence**: None - stateless bot

## Future State (v2.0 with Database)

- **Storage**: Supabase PostgreSQL
- **Benefits**:
  - Track user mood history
  - Personalized recommendations based on history
  - Guild-level analytics
  - User preferences (DM notifications, favorite genres)
  - Bot-wide daily statistics

## Migration Files

### `001_init.sql`

Initial schema creation with tables:

1. **users** - Discord user information
2. **moods_history** - Log of all mood interactions (compliments, music, hugs)
3. **user_preferences** - User-specific settings
4. **guild_statistics** - Per-server usage stats
5. **daily_stats** - Bot-wide daily aggregated stats

## How to Run Migration

### Prerequisites

1. Create a [Supabase](https://supabase.com) project
2. Note your connection details:
   - Project URL
   - API Key (service_role for backend)
   - Database password

### Option 1: Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard → SQL Editor
2. Copy content from `001_init.sql`
3. Click "Run" to execute

### Option 2: psql CLI

```bash
psql postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres -f migrations/001_init.sql
```

### Option 3: Node.js Migration Script (Future)

```bash
pnpm run migrate:up
```

## Environment Variables

Add to `.env` when ready to migrate:

```env
# Supabase Configuration
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
```

## Code Changes Needed

When migrating to database:

1. **Install Dependencies**:
   ```bash
   pnpm add @supabase/supabase-js
   ```

2. **Create Database Service** (`src/services/database.ts`):
   ```typescript
   import { createClient } from '@supabase/supabase-js';
   
   export const supabase = createClient(
     process.env.SUPABASE_URL,
     process.env.SUPABASE_SERVICE_KEY
   );
   ```

3. **Update Commands**:
   - Log interactions to `moods_history` table
   - Query user preferences for personalized responses
   - Update guild statistics on each command

4. **Data Migration Script**:
   - Optionally migrate existing JSON data to database
   - Create `scripts/migrate-json-to-db.ts`

## Rollback

To rollback migration:

```sql
DROP TABLE IF EXISTS daily_stats CASCADE;
DROP TABLE IF EXISTS guild_statistics CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS moods_history CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

## Schema Diagram

```
users (1) ─────< moods_history (many)
  │
  └───────────< user_preferences (1:1)

guild_statistics (independent)
daily_stats (independent, aggregated)
```

## Next Steps

1. Setup Supabase project
2. Run `001_init.sql` migration
3. Update `.env` with credentials
4. Implement database service layer
5. Update commands to log interactions
6. Create analytics dashboard (future)

## Notes

- **JSON files remain**: Keep as fallback for compliments/gifs
- **Incremental migration**: Add database without removing JSON initially
- **Privacy**: Ensure GDPR compliance - users can request data deletion
- **Supabase free tier**: 500MB storage, good for initial phase

---

**Status**: 🟡 Planned - Schema ready, waiting for Supabase setup
