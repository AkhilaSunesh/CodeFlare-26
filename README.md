# Perseus & Medusa

*"You are Perseus, son of Zeus. The lair lies ahead. There is no one left to send but you."*

An interactive cinematic retelling of Perseus's descent into Medusa's lair built for CODEFLARE 2.0, IEEE Student Branch, Saintgits College.

This is not a story you read. It is a trial you accept. Scroll through a 50 frame cinematic sequence rendered frame by frame to your movement, raise the mirrored shield in a life or death mini game, and walk away having lived the myth rather than simply been told it.

**[Live Deployment Link — add here]**

## The Experience

You will be asked to accept or refuse a king's impossible task. Refuse, and shame becomes its own kind of stone. Accept, and the gods take notice.

Athena arms you with a shield polished to a mirror's shine. Hermes gifts you sandals with wings of their own. Armed, you step into the dark, where scrolling itself becomes the mechanism of your descent, each pixel of movement scrubbing forward through torchlit stone, a sleeping gorgon, and a blade guided only by reflection.

Survive the shield mini game, and Pegasus rises from the light to meet you. Fail, and you learn why so few return.

## Run It

Open `index.html` directly in a browser. For the most reliable asset loading (frame sequence, audio), serve the folder with a local static server instead:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000/`.

## Experience Flow

1. **The Challenge** — accept or refuse the king's task.
2. **Divine Favor** — accept the gifts of Athena and Hermes, and enter the lair.
3. **The Descent** — scroll through the cinematic 50 frame sequence as it plays out beneath your cursor.
4. **The Trial** — choose **FIGHT – RAISE SHIELD** when the battle prompt appears.
5. **Shield of Perseus** — play the mini game in the centered popup, block the strikes, never meet her eyes.
6. **The Aftermath** — close or complete the battle, then continue into the epilogue and the myth's unanswered questions.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure and story content |
| `style.css` | Visual design, responsive layout, and popup styling |
| `script.js` | Frame preloading, scroll scrubbing, audio, accordion, and mini game logic |
| `A_cinematic_second_sequence_frames/` | Cinematic frame sequence |
| `prologue_bg.jpg`, `article_hero_banner.jpg`, scene images | Visual assets |
| `gods-of-greece-hades-by-ende-dot-app.mp3` | Optional soundtrack |

## Notes

- Browser autoplay policies may require clicking the audio control before sound can play.
- The FAQ appears after the scroll scrubbed story and expands one question at a time.
- Built solo within the CODEFLARE 2.0 time limit (10:00 AM – 4:00 PM, 06 September 2026).

---

*A retelling of Perseus and Medusa. Some myths are read. This one is entered.*
