---
name: audio
description: Use when designing or reviewing music, sound effects, voice, audio behavior, mix priorities, audio assets, or player audio accessibility.
---

# Audio

Audio communicates action, space, emotion, feedback, and priority. Define sonic identity before collecting disconnected sounds.

## Direction

- Establish mood, reference qualities, instrumentation or texture, dynamic range, and what the game should never sound like.
- Group sounds by gameplay purpose: input feedback, player state, threats, world ambience, rewards, UI, narration, and music transitions.
- Every important action needs feedback proportionate to its gameplay consequence.

## Runtime Behavior

- Map player and world states to music, ambience, stingers, and layers: entry/exit trigger, transition rule, priority, persistence, and fallback. Do not leave state changes implied.
- For each important event, specify trigger, asset or variation pool, cooldown, concurrency, spatial behavior, gain target, priority, ducking, and stop rule.
- Specify when a sound starts, stops, layers, varies, ducks, persists, and yields to higher-priority sounds.
- Avoid fatigue with controlled variation, cooldowns, concurrency limits, and mix priorities.
- Music states and transitions should follow player context without masking critical gameplay feedback.
- Keep volume categories, mix settings, subtitles, captions, visual alternatives, and separate critical-cue controls accessible; do not make audio sole carrier of urgency or success.
- For critical audio, define audible response under competing mix, ducking and interruption behavior, plus visual/haptic/text fallback when muted, unavailable, or masked.

## Production

- Record asset format, channels, sample rate, loop points, loudness expectations, source/license status, implementation parameters, memory/streaming thresholds, and preload/stream choice with assets or project configuration.
- Verify on target playback hardware and noisy real-world conditions when audio carries gameplay information.
