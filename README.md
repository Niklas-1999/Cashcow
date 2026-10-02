# ♥ Cashcow Waifu Casino

An anime-themed online casino that runs entirely in the browser — 14 casino games, 32 collectible waifus, gacha summoning, outfits, gifts and an affection system. **All coins are simulated. There is no real money anywhere.**

Everything is generated in the browser: every character is drawn procedurally as layered SVG, every sound effect and the background music are synthesized with WebAudio. There are no image or audio files and no build step, so it runs straight from GitHub Pages.

## Play

- **GitHub Pages:** `https://niklas-1999.github.io/Cashcow/` (once Pages is enabled; see below)
- **Locally:** ES modules need a web server, so `index.html` won't work if you open it straight from disk. Run this in the repo folder:
  ```sh
  python -m http.server 8000
  ```
  then open http://localhost:8000.

### Enabling GitHub Pages

Repository **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save.** The site goes live a minute later.

## Features

### Casino games (14)
| Game | Highlights | Return |
|---|---|---|
| **Sakura Slots** | 5×3 reels, 10 paylines. Your partner waifu is the WILD. Free spins at 2× with retriggers. Autoplay. | ~96% |
| **Blackjack** | 6-deck shoe, dealer peeks, stands on all 17s. Split (up to 4 hands), double, 3:2 naturals. Keyboard shortcuts. | ~99.5% |
| **Roulette** | European single-zero. Animated SVG wheel and ball, full betting board, chip values, undo/rebet/2×, history. | 97.3% |
| **Video Poker** | Jacks or Better 9/6, hold/draw, strategy hint button. | ~99.5% |
| **Baccarat** | Player/Banker/Tie, full third-card tableau, bead road. | ~98.8% |
| **Craps** | Pass/Don't Pass with point puck, Field, Any 7, Any Craps, Yo. 3D CSS dice. | ~98.6% (line) |
| **Plinko** | 8/12/16 rows × low/medium/high risk, up to 1000×, many balls at once. | ~99% |
| **Mines** | 5×5 grid, 1–24 bombs, cash out anytime. | 99% |
| **Love Rocket** (crash) | Live curve, auto cash-out, auto-bet, waifu "passengers". | 99% |
| **Fortune Wheel** | Low/medium/high risk wheels. | 99% |
| **Hi-Lo** | Higher/lower streak multiplier with skip and cash-out. | 97% |
| **Keno** | 40 numbers, pick 1–10, animated draw. | ~99% |
| **Scratch Cards** | Scratch the foil with mouse/touch, match 3. | ~97% |
| **Dice** | Roll over/under, adjustable target, multiplier or win chance. Autoplay. | 99% |

The RTP figures come from exact calculation or simulation, which runs against the same math modules the games use (`js/games/*-math.js`).

### Waifus
- **32 original waifus** across 4 rarities (R ★3 · SR ★4 · SSR ★5 · UR ★6) and **12 personalities**: genki, dandere, kuudere, tsundere, gyaru, sleepyhead, onee-san, chuunibyou, deredere, ojou-sama, yandere (the playful kind), gambler.
- **Procedural SVG art.** There are 10 hairstyles (twin tails, drills, buns, hime cut…), 5 fringe styles, layered anime eyes and 13 expressions (happy, excited, love, sad, cry, surprised, shy, smug, angry, wink, sleepy…). Characters also have traits like cat/fox/bunny/elf ears, horns, halos and wings.
- **Idle animation:** blinking, breathing, swaying hair and tails.

### Your partner
- The chosen waifu sits beside every game. She **reacts** to wins, big wins, losses, losing streaks and pushes with matching expressions and animations.
- Her **speech bubbles** follow her personality and come with typewriter text and synthesized voice blips.
- **Head pats** (click her): +affection, capped daily.
- **Gifts:** 17 gifts. Every waifu loves two gift categories (2.5× affection) and dislikes one.
- **Affection meter** with 7 tiers (Stranger → Soulmate). Higher tiers unlock **memories** in her profile, strengthen her perk, and at Soulmate unlock the **Soulmate Gown**.
- **Partner perks** apply only while she's your partner: +% winnings in a specific game or all games, cashback on losses, a bigger daily bonus, gacha discounts, shop discounts, or extra affection. Perks scale with constellation stars and affection.
- **Rescue:** if you go broke, she offers you emergency coins (with a cooldown).

### Gacha
- A weekly rotating **rate-up banner** (1 featured UR and 2 featured SSRs).
- 1× and 10× summons. The 10× guarantees SR+; pity guarantees an SSR+ within 50 summons and a UR within 120.
- A magic-circle summon animation with the orb colored by your best rarity, flip-to-reveal cards, and a full-screen showcase for new SSR/UR pulls.
- **Duplicates** add constellation stars (max 5★, +15% perk each). Beyond that they convert into coins.

### Dress-up and boutique
- **18 outfits** (sailor, blazer, maid, casino dealer, kimono, qipao, idol, witch, gothic lolita, techwear, knight armor, ball gown, Soulmate Gown…). Each one is tinted in the wearer's palette.
- **17 accessories** (ears, halo, horns, wings, crown, glasses, headphones, beret…).
- A wardrobe with a live preview. Items can be bought straight from the wardrobe.

### Progression
- **Player levels and VIP tiers** (Bronze → Sakura Royalty) from XP earned by wagering, with a coin reward at every level-up.
- A **daily login calendar** with a 7-day streak.
- **3 daily missions** drawn at random from a pool.
- **44 achievements** with coin rewards.
- **Statistics:** totals, per-game breakdown, best multiplier and your closest bonds.

### Presentation
- Falling sakura petals and bokeh background, particle confetti, coin showers, coins flying into your wallet, floating win text.
- BIG / MEGA / LEGENDARY win overlays.
- Synthesized SFX for chips, cards, reels, wheels, dice, explosions and fanfares, plus optional procedural lo-fi music.
- A responsive layout for desktop, tablet and phone. On phones you get a bottom nav and a floating partner.
- **Settings:** your name, sound, music, voice blips, volume, fast mode, reduced motion, and save export/import/reset.

## Project structure

```
index.html            entry point
css/                  style.css (design system) · pages.css · games.css
js/main.js            shell, router, top bar
js/state.js           save data (localStorage), wallet, perks, levels, daily
js/casino.js          shared round settlement (perks, stats, XP, effects, reactions)
js/companion.js       partner panel: reactions, pats, gifts, affection, rescue
js/progress.js        achievements + daily missions
js/gacha-core.js      gacha rates, pity, banners
js/shop-core.js       purchases + equipping
js/audio.js           synthesized SFX + procedural music
js/fx.js              background, particles, big-win overlay
js/waifu/             render.js (SVG renderer) · parts.js (outfits/accessories) · data.js (roster, items) · dialogue.js
js/games/             one module per game + *-math.js (pure, simulatable)
js/pages/             lobby, gacha, collection, wardrobe, shop, daily, achievements, stats, settings, intro
dev/preview.html      art gallery for the renderer (?mode=all|expr|outfit|acc&id=…)
```

Progress is saved to your browser's `localStorage`. Use **Settings → Export save** to move it to another device.

---
*Fan-made for fun. All characters are original. Simulated currency only — it cannot be bought, sold or withdrawn.*
