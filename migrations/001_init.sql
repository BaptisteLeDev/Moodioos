-- =============================================================================
-- Moodioos Database Migration - Initial Schema
-- =============================================================================
-- Target: Supabase PostgreSQL
-- Purpose: Persist user mood history, preferences, and bot interaction stats
-- Version: 001
-- Created: 2026-01-06
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Table: users
-- Purpose: Store Discord user information
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discord_id VARCHAR(20) NOT NULL UNIQUE,
    discord_username VARCHAR(255) NOT NULL,
    discord_discriminator VARCHAR(4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_interaction_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_discord_id ON users(discord_id);
CREATE INDEX idx_users_last_interaction ON users(last_interaction_at);

-- =============================================================================
-- Table: moods_history
-- Purpose: Track mood-related interactions (compliments, music)
-- =============================================================================
CREATE TABLE IF NOT EXISTS moods_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL, -- 'compliment', 'music', 'hug_sent', 'hug_received'
    content TEXT, -- The actual message, song recommendation, or gif URL
    guild_id VARCHAR(20), -- Which server the interaction happened in
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_moods_history_user_id ON moods_history(user_id);
CREATE INDEX idx_moods_history_interaction_type ON moods_history(interaction_type);
CREATE INDEX idx_moods_history_guild_id ON moods_history(guild_id);
CREATE INDEX idx_moods_history_created_at ON moods_history(created_at);

-- =============================================================================
-- Table: user_preferences
-- Purpose: Store user preferences for personalized experience
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    favorite_music_genre VARCHAR(100), -- e.g., 'lofi', 'lo-fi jazz', 'indie pop'
    dm_notifications BOOLEAN DEFAULT TRUE, -- Opt-in for periodic motivational DMs
    language VARCHAR(10) DEFAULT 'en', -- Future i18n support
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- =============================================================================
-- Table: guild_statistics
-- Purpose: Track bot usage per guild/server
-- =============================================================================
CREATE TABLE IF NOT EXISTS guild_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guild_id VARCHAR(20) NOT NULL UNIQUE,
    guild_name VARCHAR(255) NOT NULL,
    total_interactions INTEGER DEFAULT 0,
    total_compliments INTEGER DEFAULT 0,
    total_music_recommendations INTEGER DEFAULT 0,
    total_hugs INTEGER DEFAULT 0,
    bot_joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_interaction_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_guild_statistics_guild_id ON guild_statistics(guild_id);
CREATE INDEX idx_guild_statistics_last_interaction ON guild_statistics(last_interaction_at);

-- =============================================================================
-- Table: daily_stats
-- Purpose: Track daily bot-wide statistics for analytics
-- =============================================================================
CREATE TABLE IF NOT EXISTS daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stat_date DATE NOT NULL UNIQUE,
    total_interactions INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    total_compliments INTEGER DEFAULT 0,
    total_music_recommendations INTEGER DEFAULT 0,
    total_hugs INTEGER DEFAULT 0,
    total_voice_joins INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_stats_stat_date ON daily_stats(stat_date);

-- =============================================================================
-- Functions: Auto-update updated_at timestamp
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guild_statistics_updated_at
    BEFORE UPDATE ON guild_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Initial Data / Seeds (Optional)
-- =============================================================================
-- You can add default data here if needed

-- =============================================================================
-- Comments for Documentation
-- =============================================================================
COMMENT ON TABLE users IS 'Discord users who have interacted with Moodioos';
COMMENT ON TABLE moods_history IS 'Historical log of all mood-related interactions';
COMMENT ON TABLE user_preferences IS 'User-specific settings and preferences';
COMMENT ON TABLE guild_statistics IS 'Per-guild usage statistics for bot analytics';
COMMENT ON TABLE daily_stats IS 'Bot-wide daily aggregated statistics';

-- =============================================================================
-- Migration Complete
-- =============================================================================
