# Asset Migration Tools

`build-icon-sprite.js` is the repeatable icon build. It reads `icon.md`, emits only the icons reachable from the site into the organized `assets/icons/` tree, and regenerates:

- `assets/icons/sprite.svg`
- `assets/icons/manifest.json`

Run from the project root:

```powershell
node tools/assets/build-icon-sprite.js
```

`migrate-assets.js` remains available for the older owner-supplied asset-folder migration. It is not part of the runtime build.
