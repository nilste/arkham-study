# Arkham Study

Swipe through the player cards of Arkham Horror: The Card Game as full-size card
images, the way you would flip through them on a table. Built for a phone in
portrait, works on desktop too (arrow keys, buttons, scrubber).

- **Collection:** tick the products you own. The ticks live in this browser and
  can be saved as a link (`/?own=core_2026,dwlp`) to move them to another device.
- **Look inside a box:** tap any product to swipe through only its cards.
- **My cards:** everything you own in release order, each card once (reprints
  collapse onto the earliest printing you own), signature cards right after
  their investigator.
- **Filters:** class, card type and experience level. They last for the browser
  session, so a filter picked while exploring one box does not hide cards next week.
- **Details:** scroll down on any card for its text, traits, flavour, artist and
  a link to ArkhamDB rulings. Investigators show front and back together;
  other double-sided cards flip on tap.

## Data

Cards and packs come straight from the public [ArkhamDB API](https://arkhamdb.com/api/)
in the browser, so new releases appear without a redeploy. The trimmed data is
cached in IndexedDB and refreshed in the background when it is older than 12
hours. "Refresh now" at the bottom of the home page forces it. A service worker
caches the app itself, so once visited (or installed to the home screen) it
opens offline with the cached cards; images still need a connection.

Images load from [arkham.build](https://arkham.build)'s CDN (750x1050 AVIF,
including newer cards ArkhamDB has no image for) and fall back to ArkhamDB's own
300x419 PNG, then to a text rendering of the card. The URLs are built in
`src/lib/arkham/images.ts`.

Game symbols (classes, skills, actions, chaos tokens) in card text use ArkhamDB's
icon font, bundled as `src/lib/assets/arkham-icons.woff` because ArkhamDB does not
serve it to other sites. `src/lib/arkham/icons.ts` maps the text tokens to glyphs.

Cycle names are not in the API; `src/lib/arkham/cycles.ts` names the known
ones, and an unknown future cycle falls back to the name of its first pack.

## Develop

```bash
npm install
npm run dev
```

`npm test` runs the unit tests, `npm run check` type-checks, `npm run build`
writes the static site to `build/`.

## Deploy (free)

**GitHub Pages:** push to a GitHub repository, then in _Settings > Pages_ set
_Source_ to _GitHub Actions_. `.github/workflows/deploy.yml` builds and deploys
every push to `main`, serving from `https://<user>.github.io/<repo>/`.

**Cloudflare Pages** (alternative, serves from the domain root): connect the
repository, build command `npm run build`, output directory `build`, and set the
environment variable `NODE_VERSION=24`.

Any other static host works the same way: upload `build/`. Set `BASE_PATH` (for
example `/arkhamstudy`) when the site is not served from the domain root.

## Legal

Unofficial fan project. Arkham Horror: The Card Game, its card texts and images
are © Fantasy Flight Games. Card data and the icon font are from ArkhamDB, images
from arkham.build and ArkhamDB.
