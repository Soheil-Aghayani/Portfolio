# Icon Decisions

This project uses the local SVG sprite as its only runtime icon source. The generated sprite is built from the canonical files in `assets/icons`; `icon.md` is an offline reference used only when a canonical local file is missing. No icon font or runtime download is allowed.

## Family Policy

- Prefer the supplied local SVG when it is legible and belongs to the intended brand or game domain.
- Prefer a thin outline family for small controls and dense cards. Supplied filled game assets remain available for game-domain states where filled artwork is intentional.
- Preserve intentional multi-color artwork. Monochrome control icons use `currentColor` so all themes can recolor them.
- Do not use emoji, text-symbol controls, or Material Symbols as UI icons.
- Theme switchers use one icon on the trigger; theme color dots remain icon-free color controls.

## Explicit Decisions

| Location | Sprite key | Decision | Reason |
| --- | --- | --- | --- |
| Publication and credential links | `states/external-link-rounded` | Replaced the animated circular fallback with a static 1.65px outline | The previous animation looked incomplete and read like a loading indicator. |
| LCA training and publication filter | `ui/recycle-linear` | Added a thin outline recycle icon | The supplied filled recycle artwork was too heavy at card size. |
| Waste Mgmt in Sports | `ui/sport-soccer-16-filled` | Reused the supplied filled soccer ball in the UI category | The previous outline ball read as an abstract target at card size. |
| Waste Coding Methods | `ui/qr-code-linear` | Added a thin outline QR icon | The supplied filled QR artwork was visually dense at card size. |
| COP29 Summit Delegation | `ui/globe` | Replaced the filled globe artwork with the thin local earth outline | The filled pixel-style globe was too heavy beside the delegation heading. |
| Theme switcher | `ui/palette-broken` on the trigger only | Restored a thin palette outline on the trigger; theme dots stay empty | The trigger needs an affordance, while icons inside six color dots add visual noise. |
| Get in Touch | `ui/mail` | Replaced the pixel stair-step send symbol with a thin mail outline | The contact action should use a legible non-pixel icon. |
| Music toggle | `ui/music-off-round` | Replaced the filled speaker/X artwork with a thin outline | The filled mark was too heavy in the floating control. |
| Telegram social link | `brand/telegram` | Replaced the filled circular logo with a thin local paper-plane outline | The filled logo was visually heavier than the surrounding outline icons. |
| Hero terminal greeting | Literal `>` | No SVG icon | The natural terminal prompt is clearer than a decorative command icon. |
| Terminal, Game Center, and Notes traffic lights | Empty `.os-dot` / `.notes-dot` buttons | No child icons | The colored controls already communicate their function and match the window convention. |
| Browser and search favicon | `brand/favicon` plus `/favicon.png` | Explicit teal SVG with 48px and 180px PNG fallbacks | A crawlable raster fallback avoids a generic browser/search placeholder when an SVG is not rendered. |
| Direct terminal commands | `resume` and `matrix` removed | Keep `screensaver matrix` as an explicit saver theme | Resume was not actionable, while Matrix remains useful as a screensaver mode. |

## Verification Rules

- Run `node tools/assets/build-icon-sprite.js` after changing canonical SVGs.
- Validate every referenced local file, SVG `viewBox`, and sprite symbol before publishing.
- Keep external license metadata in `assets/icons/manifest.json` and verify any future imported pack before redistribution.
