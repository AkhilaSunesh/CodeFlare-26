# Perseus & Medusa

An interactive cinematic retelling of Perseus entering Medusa's lair. Scroll through the 50-frame sequence, use the mirrored shield in the battle mini-game, and explore the myth FAQ at the end.

## Run

Open `index.html` directly in a browser. For the most reliable asset loading, serve the folder with a local static server, for example:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000/`.

## Experience Flow

1. Accept or refuse the king's challenge.
2. Accept the divine gifts and enter the lair.
3. Scroll through the cinematic sequence.
4. Choose **FIGHT - RAISE SHIELD** when the battle prompt appears.
5. Play the shield mini-game in the centered popup.
6. Close or complete the battle, then continue to the epilogue and FAQ.

## Files

- `index.html` - page structure and story content
- `style.css` - visual design, responsive layout, and popup styling
- `script.js` - frame preloading, scroll scrubbing, audio, accordion, and mini-game logic
- `A_cinematic_second_sequence_frames/` - cinematic frame sequence
- `prologue_bg.jpg`, `article_hero_banner.jpg`, and scene images - visual assets
- `gods-of-greece-hades-by-ende-dot-app.mp3` - optional soundtrack

## Notes

- Browser autoplay policies may require clicking the audio control before sound can play.
- The FAQ appears after the scroll-scrubbed story and expands one question at a time.
