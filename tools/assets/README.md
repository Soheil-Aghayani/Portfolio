# Asset Migration Tools

`migrate-assets.js` is the repeatable asset organizer. It moves canonical media into the `assets/` taxonomy, imports the supplied SVG folder without replacing semantic duplicates, normalizes monochrome fills, and regenerates:

- `assets/icons/sprite.svg`
- `assets/icons/manifest.json`

Run from the project root:

```powershell
node tools/assets/migrate-assets.js
```

`replace-material-icons.js` is the one-time portfolio markup migration. The reviewed historical scripts are retained under `tools/assets/legacy/` for reference only.
