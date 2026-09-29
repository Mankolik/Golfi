# Golfi ✳

A small, mobile-first golf escape. Play nine seeded, procedurally generated holes in your browser. Built with vanilla JavaScript and Canvas 2D: no install, build step, server, CDN, or runtime dependencies.

## Play

- **Drag back anywhere on the course and release** to swing. Direction is opposite your pull; distance sets power. Return near the starting point to cancel, or use Cancel shot.
- Alternatively, **tap the course to aim**, then **hold the swing button and release** at your desired power. The meter rises and falls.
- Pick **driver, iron, wedge, or putter**. The dotted trajectory previews the selected shot, including wind and terrain.
- Driver travels furthest; wedge flies higher and stops sooner. Use a wedge from sand and a putter on the green.
- Water adds one penalty stroke and returns the ball to the shot's starting position. The outer course boundary rebounds the ball. Trees block low shots at their trunks. High-speed putts can skip the cup.
- Open **Round** for the scorecard or a link to the same seeded course. A shared link reproduces the holes, hazards, and wind. Progress is saved locally on the same browser.
- Keyboard: left/right arrows aim, hold/release Space swings, 1–4 choose a club. Sound is optional and off initially.

## GitHub Pages

The site is ready to serve directly from the repository root, including under `/Golfi/`.

1. Open **Settings → Pages** in this repository.
2. Set **Source** to **Deploy from a branch**.
3. Select **main** and **/ (root)**, then save.
4. GitHub displays the published URL when deployment finishes (normally `https://mankolik.github.io/Golfi/`).

All paths are relative. `.nojekyll` disables Jekyll processing. No secrets or workflow configuration are required. On iPhone, use Safari → Share → Add to Home Screen for a standalone-style launch. The game requires a connection to load; an offline service worker is not included.

## Local development

```sh
python3 -m http.server 8080
# Open http://localhost:8080
```

Use an HTTP server; JavaScript modules cannot reliably load from `file://`.

```sh
npm test
```

Tests use the built-in Node test runner and require no npm install.

## Implementation

- `engine.js`: pure deterministic course generator and 120 Hz physics. Horizontal velocity, vertical flight, gravity, air drag, wind, bounce restitution, surface-specific friction, slight putting slopes, tree collisions, water penalties, and speed-limited cup capture. This is an approachable golf simulation rather than a full aerodynamic model.
- `render.js`: cached, procedurally drawn course artwork; live ball shadows, trails, flag, swing animation, and shot preview. Rendering follows requestAnimationFrame independently of physics; device pixel ratio is capped at 2 for phones.
- `game.js`: pointer/keyboard controls, nine-hole progression, sound, local saves, seeded share links, and scorecards. Hidden tabs pause simulation rather than catching up a huge elapsed interval.
- `style.css`: portrait and landscape layouts with safe-area support.
- `tests/physics.test.js`: deterministic generation, 500-course safety checks, terrain friction, wind, loft, cup capture, water replay, tree collisions, prediction agreement, and shot stability.

World coordinates are scaled at 0.5 metres per unit for the distance display. Course generation protects a continuous fairway corridor; seeds and hole numbers determine layout, wind, and green slope.
