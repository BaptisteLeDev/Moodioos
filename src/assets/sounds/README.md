
# 🎵 Moodioos Sounds

This directory contains audio files for voice channel features.

## Directory Structure

```
sounds/
├── love.mp3       # "Je t'aime" message (for /mood say:love)
└── README.md      # This file
```

## Current Status

🟡 **Placeholder** - Audio files need to be added

## Required Audio Files

### `love.mp3`
- **Purpose**: Played when `/mood say:love` is used
- **Content**: Human-recorded "Je t'aime" (not TTS)
- **Format**: MP3
- **Duration**: ~2-3 seconds
- **Quality**: 128kbps minimum
- **Source**: Record your own or use royalty-free voice clips

## How to Add Audio Files

1. **Record or obtain** audio files (ensure proper licensing)
2. **Convert to MP3** format if needed
3. **Place in this directory**: `src/assets/sounds/`
4. **Test** using `/mood say:love` command in a voice channel

## Voice Playback Implementation

Voice playback requires `@discordjs/voice` package:

```bash
pnpm add @discordjs/voice
pnpm add libsodium-wrappers ffmpeg-static @discordjs/opus
```

**Implementation** (future enhancement):
```typescript
import { joinVoiceChannel, createAudioPlayer, createAudioResource } from '@discordjs/voice';

// In /mood say:love command
const resource = createAudioResource('./assets/sounds/love.mp3');
const player = createAudioPlayer();
player.play(resource);
connection.subscribe(player);
```

## Future Sounds

Potential additions:
- `hug.mp3` - Sound effect for /hug command
- `motivation.mp3` - Motivational audio clips
- `ambient/` - Background music options

## Licensing

⚠️ **Important**: Ensure all audio files have proper licensing:
- Use royalty-free audio
- Record your own voice
- Attribute sources if required

## Testing

To test audio playback:
1. Join a voice channel in Discord
2. Use `/mood join` to make bot join
3. Use `/mood say:love` to play audio
4. Check audio quality and volume levels

---

**Status**: 🟡 Awaiting audio file creation  
**Priority**: Medium (feature enhancement)
