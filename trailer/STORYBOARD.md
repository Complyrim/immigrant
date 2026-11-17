# Immigrant: game trailer storyboard

**Format:** 9:16 vertical, about 40 seconds, for @immigrant.game (Reels, TikTok, Shorts).
**Video:** Higgsfield image-to-video. Each shot starts from one of the game's own painted scenes (`public/assets/backdrops/`), so the trailer looks like the game. Higgsfield adds only the camera movement and life in the scene (people, traffic, light).
**Sound:** the game's recorded ElevenLabs lines (already paid for), plus a royalty-free music bed added in the edit. Higgsfield's sound stays off.
**Edit:** clips are joined locally with ffmpeg; title cards are added in the edit, never generated (AI text comes out garbled).

**Honesty rule:** the game has many endings, including removal and going home. The trailer must not promise citizenship. It shows the journey and says the outcome depends on your choices.

## Shots (8 × 5 s)

| # | Scene (start frame) | Motion prompt for Higgsfield | Sound over it | Card |
|---|---|---|---|---|
| 1 | `airport` | Slow push-in through a busy arrivals hall, travellers with suitcases walking past, soft morning light through tall windows | Officer: "What brings you to the United States?" | |
| 2 | `airport-booth` | Static camera, a border officer looks up from a passport at the booth, slight head nod | Player: "I am here to study. My program starts this month." | |
| 3 | `city-nyc` | Slow aerial drift over the city street at golden hour, cars moving, people on sidewalks | music rises | **One suitcase. A new country.** |
| 4 | `apartment-night` | Gentle dolly toward a window at night, city lights flicker outside, curtains move slightly | Player: "Everything else can wait until morning." | |
| 5 | `worksite-warehouse` (or `workplace`) | Handheld tracking along aisles, workers moving boxes and carts, forklift in background | music | **Work. Papers. Deadlines.** |
| 6 | `rooftop` | Slow orbit across a rooftop at dusk, string lights glowing, friends laughing at the edge | Friend: "Nobody leaves until the sky goes dark." | |
| 7 | `uscis` | Slow push-in on an interview desk in a government office, papers being reviewed | music drops | **Every choice changes your story.** |
| 8 | `court` | Wide shot of a ceremony hall, people standing, light falling across the room, camera rises slowly | silence, then music hit | **IMMIGRANT** · *Play free in your browser* · complyrim.github.io/immigrant |

## Generation settings

- Model: the best image-to-video model on your plan (Kling or Seedance), 5 s, 9:16, sound off.
- Prompts describe motion only and stay in the scene's painted style: add "painterly, keep the colours and style of the image" to each.
- People who appear stay unidentifiable, mid-distance or from behind, so no single face carries the story.
- One take per shot first; redo only a shot that warps or turns uncanny.

## Before posting

- Check the export has no Higgsfield watermark (depends on your plan).
- Check every card against the no long dashes rule, and that nothing promises an outcome.
