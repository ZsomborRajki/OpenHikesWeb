# OpenHikes Web

The web companion of [OpenHikes](https://github.com/ZsomborRajki/OpenHikes), the
iOS hiking app: plan a trail on the map and look over the ones you keep. It
does not record.

- **Plan a trail.** Tap the map to add stops, reorder them, and save the line.
- **Keep trails.** Import a GPX file, or save a plan. Trails stay in this browser.
- **Read a trail.** Distance, climb, time, and an elevation profile to scrub.
- **Take it with you.** Export any trail as GPX, which the iOS app imports.

## Run it

Node 24 or newer.

```sh
npm install
npm run dev
```

That runs with no credentials, on a sketch map that draws trails on a blank
sheet. For Apple Maps, copy `.env.example` to `.env.local` and paste a MapKit
JS token; the file says where one comes from.

## Check it

```sh
npm run verify
```

One command for everything CI runs: formatting and lint, types, a search for
unused code, the unit tests with their coverage floor, and the browser tests
with an accessibility audit of every screen. The browser tests need
`npx playwright install chromium` once.

## Find your way around

```
src/routes/     One file per screen: wiring, and nothing else
src/lib/
  app/          The composition root: where each port gets its adapter
  shell/        The window: map, panel, sheet
  map/          The map port, Apple Maps behind it, and the sketch map
  trails/       What a trail is, its figures, GPX, and the library
  planner/      The trail being drawn
  design/       Tokens and shared components
  general/      Geodesy and formatting
e2e/            Browser tests
```

[`AGENTS.md`](AGENTS.md) has the architecture, the conventions and the reasons.

Built with SvelteKit, TypeScript and MapKit JS.
