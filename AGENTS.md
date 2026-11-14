# AGENTS.md

How code is written in this repository: the commands, the architecture, the
conventions, and the decisions that are already settled. Read it before
changing anything. [`README.md`](README.md) says what the site is and how to
run it.

This is the web companion of the [OpenHikes](https://github.com/ZsomborRajki/OpenHikes)
iOS app: a trail planner and a trail viewer, with no recording. It is kept
small on purpose. Clean structure comes before more features, and a feature
that does not fit the structure waits until the structure is ready for it.

## House rules

- **`npm run verify` passes before a change is done.** It is every gate CI
  runs.
- **Only `src/lib/app` names an adapter, and only `src/routes` knows the
  router.** See _Architecture_. `npm run lint` enforces both.
- **A suite never reaches the network.** Unit suites use stand-ins. Browser
  suites run on the sketch map, and fail on a request that leaves the machine.
- **Never commit `.env.local`, or a map token anywhere.**
- **No fixed sleeps.** Wait on the effect, never on a duration.
- **The coverage floor is never lowered to land a change.**
- **Each fact is written in exactly one place.** See _Documentation_.

## Commands

```sh
npm install
cp .env.example .env.local   # then paste a MapKit JS token; optional

npm run dev             # the dev server
npm run lint            # Prettier, ESLint and Stylelint
npm run format          # let Prettier and Stylelint fix what they can
npm run check           # types, in .ts and in .svelte; warnings fail
npm run analyze         # Knip: unused code and dependencies, then import cycles
npm run test:unit       # Vitest with coverage; fails under the floor
npm run test:e2e        # builds without a token, then Playwright on the sketch map
npm run test:e2e:live   # the one suite that needs Apple Maps and the token
npm run verify          # lint, check, analyze, test:unit and test:e2e
```

- `npx vitest run src/lib/trails` narrows the unit tests to a folder, and
  `npx playwright test e2e/planner.e2e.ts --project desktop` narrows the
  browser tests to a file and a window size.
- `npx playwright install chromium` once, before the first browser run.
- CI (`.github/workflows/ci.yml`) runs `lint`, `check`, `analyze`,
  `test:unit` and `test:e2e`. It has no token, so `test:e2e:live` is a local
  check: run it after changing `mapkit-map-surface.ts`.

### Static analysis

Each analyzer is a gate, and each has a counterpart in the iOS app's tooling:

| Tool           | What it holds the code to                                                                                                                 | Configured in                  | iOS counterpart                  |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | -------------------------------- |
| ESLint         | typescript-eslint's strict, type-aware rules; the boundaries under _Architecture_; size and complexity limits; American spelling in names | `eslint.config.js`             | SwiftLint                        |
| Stylelint      | The standard rules, and no color written outside `tokens.css`                                                                             | `stylelint.config.js`          | SwiftLint                        |
| Prettier       | One formatting                                                                                                                            | `prettier.config.js`           | —                                |
| `svelte-check` | Types in modules and templates; unused CSS selectors                                                                                      | `tsconfig.json`                | The compiler, warnings as errors |
| Knip           | No unused file, export or dependency, and no import cycle                                                                                 | `knip.jsonc`                   | Periphery                        |
| CodeQL         | Security faults, on GitHub                                                                                                                | `.github/workflows/codeql.yml` | CodeQL                           |

- **The size limits are the iOS app's**: a function of 60 lines, a file of
  500, a complexity of 12, five parameters. A module that meets one is doing
  two jobs.
- **An export that nothing imports is not exported.** Knip reports it, in a
  suite's helpers as much as in the app.
- **Silence a rule on the line, with the reason**
  (`// eslint-disable-next-line <rule> -- why`), never for a file. An ignore
  entry that no longer matches anything fails `analyze`.

## Architecture

### One window

The app is one window-sized map with a glass panel over it. `AppShell` draws
both and is the only code that measures the window. `panelLayout` decides the
shape: a panel beside the map where there is room, a sheet with detents over
it on a phone. Every route is a screen inside the panel, so the map outlives
navigation.

### Folders are product domains

`src/lib` is organized by what the code is about, as the iOS app is, and the
dependencies between folders point one way:

| Folder     | What it owns                                                   | May import                           |
| ---------- | -------------------------------------------------------------- | ------------------------------------ |
| `general/` | Geodesy, formatting, and what every domain needs               | nothing                              |
| `design/`  | Tokens and the handful of components every screen is built of  | nothing                              |
| `map/`     | The map port, the scene, and the two map adapters              | `general`                            |
| `trails/`  | What a trail is: its figures, GPX, the library and its screens | `general`, `design`, `map`           |
| `planner/` | The trail being drawn, its stops and legs, and its screen      | `general`, `design`, `map`, `trails` |
| `shell/`   | The window: panel, sheet, layout rule                          | `general`, `design`, `map`           |
| `app/`     | The composition root                                           | everything                           |

A folder that outgrows one level nests by job (`trails/gpx/`), and a folder's
root holds what its subfolders share. Reach another folder through `#lib/`;
relative imports stay inside a folder.

### Kinds of module

The file name says what kind of module a file is, and the kind says what it
may depend on:

| Kind        | Name            | What it is                                            | Must not touch                                            |
| ----------- | --------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| Domain      | `*.ts`          | Pure functions, plain data, and ports                 | Svelte, models, components, adapters, the browser's state |
| Model       | `*.svelte.ts`   | Observable state over the domain, as a class          | Components, adapters, the browser's state                 |
| Component   | `*.svelte`      | What is drawn. Takes props, reports through callbacks | Adapters, the router                                      |
| Adapter     | `adapters/*.ts` | The one user of a vendor library or a browser store   | Models, components                                        |
| Composition | `app/*.ts`      | Builds the models from their adapters, once           | Components                                                |
| Route       | `src/routes/**` | Hands a screen its model, its links and its callbacks | Adapters                                                  |

- **A domain module is handed what it needs.** No `window`, no `fetch`, no
  `Date.now()`, no `crypto`. The time and new ids arrive as `Now` and `NewId`
  (`general/ambient.ts`), so a test decides both.
- **A model is a class with `$state` fields behind getters.** Nothing outside
  it writes its state. Its methods answer with an outcome, not an exception,
  when the store refuses a write: the screen that asked has to say something
  either way.
- **A screen component owns its copy and takes typed problems**, such as
  `importProblem`, never a ready-made sentence.
- **A route is wiring.** It reads the app from context (`useApp()`), sets what
  the map shows, and passes `resolve()`d links down. Logic worth a test lives
  in `src/lib`.

`eslint.config.js` turns both tables into `no-restricted-imports` rules, with
the reason in each message. Change the tables there and here together.

### Ports and adapters

A port is an interface in the domain. `app/composition.ts` is the only module
that picks its adapter.

| Port              | Declared in                  | Adapters                                              |
| ----------------- | ---------------------------- | ----------------------------------------------------- |
| `MapSurface`      | `map/map-surface.ts`         | `MapKitMapSurface` (Apple Maps), `SketchMapSurface`   |
| `TrailRepository` | `trails/trail-repository.ts` | `IndexedDbTrailRepository`, `InMemoryTrailRepository` |
| `DraftStore`      | `planner/draft-store.ts`     | `LocalStorageDraftStore`, `InMemoryDraftStore`        |
| `LegRouter`       | `planner/leg-router.ts`      | `DirectLegRouter`                                     |
| `FileSaver`       | `general/file-saver.ts`      | `BrowserFileSaver`                                    |

- **Add a port when a second implementation exists**, counting a suite's
  stand-in. Not before.
- **A port with two adapters gets a contract suite**
  (`trail-repository.contract.ts`, `draft-store.contract.ts`), which each
  adapter's own test file runs against itself. A new adapter is done when the
  contract passes.

### The map

Screens describe the map; they never touch it.

- A route builds one `MapContent` (lines, pins, a frame, what a tap does) with
  a pure function such as `trailMapContent`, and hands it to `MapScene.show`.
- `syncScene` carries the scene to the `MapSurface` in three effects, so a
  scrub moves the dot and redraws no line, and a panel that changes size moves
  the insets and nothing else.
- `MapSurface` is imperative on purpose, as the iOS app keeps MapKit behind
  `MapView.Coordinator`. Nothing reactive sits between a pointer event and the
  dot it moves.
- **Apple Maps with a token, the sketch map without one.** `SketchMapSurface`
  draws trails to scale on a blank sheet. It is what a fresh checkout shows,
  and what the browser suites run against, which is why a pin there is an
  element with a role and a name.
- The map's colors are design tokens (`--route-color`), read by both adapters.

### High-frequency state stays in a leaf

The iOS app's render-isolation rule, which Svelte makes cheap but not
automatic. State that changes on every pointer event belongs to the component
that draws it, or to a model field only that component's effect reads: the
chart's scrub (`ElevationChart`), the sheet's drag (`Panel`), the map's
highlight (`MapScene.highlight`).

## Conventions

- **An import names its file, extension included** (`./trail.ts`,
  `#lib/map/map-scene.svelte.ts`). `#lib` is a Node subpath import, which
  resolves no extensions.
- **Names follow the iOS app** where the two mean the same thing: `route`,
  `stops`, `RouteProfile`, `TrailDraft`. A file header says so when a module
  is a port of the app's.
- **Numbers that must agree with the app are the app's**, each with a comment
  saying so: the Earth radius, the 3 m climb threshold, the 4 km/h hiking
  pace, the 128-character title, seven decimals in a GPX coordinate.
- **Copy is a simple explanation**, in English, written in the component that
  shows it. An empty state says what is missing and what to do next. Use the
  typographic ’ and “ ” in copy.
- **Figures are formatted per locale** through `general/formatting.ts`, in
  metric units.
- **Styles are scoped to their component and name tokens**, never values.
  `design/tokens.css` is the only place a color, a size or a timing is
  written, in light and dark.
- **Comments say why.** A file header argues for the design when the design
  needed arguing. No comment repeats the code.
- **The oldest browser is Safari 18**, the one the iOS app's own floor ships
  with. CSS or JavaScript newer than that comes with its fallback.

### Accessibility

- A control is found by its role and name, in the suites as by a screen
  reader. If a test needs a test id, the control is missing a name.
- A glyph-only button is an `IconButton`, which requires a label and is a full
  tap target.
- A composite row is one link with one name (`TrailRow`).
- A screen names its page. `ScreenHeader` writes its title into the page's,
  which is what a screen reader is told after a link, and what a tab and a
  history entry show.
- Whatever a pointer can do to a custom control, the keyboard can too: the
  elevation chart is a slider, and the sheet's grabber is a button.
- Honor `prefers-reduced-motion`, `prefers-reduced-transparency` and
  `prefers-color-scheme`. The tokens do, so a component that names tokens
  does.
- `e2e/accessibility.e2e.ts` audits every screen with axe. A new screen joins
  it in the same change.

### Tests

- **Unit tests sit beside their subject** (`trail.ts`, `trail.test.ts`), one
  `describe` per file. A test name is a sentence about behavior.
- **A suite builds its subject from stand-ins**: an in-memory adapter, or a
  double written in the test file (`ScriptedLegRouter`, `RecordingSurface`).
  Shared values live in a `*.fixtures.ts`.
- **A suite that tests effects or the DOM starts with
  `// @vitest-environment jsdom`.** The default environment is Node, where
  Svelte compiles for a server and no effect ever runs.
- **Wait on the effect.** A double hands back a promise that settles after
  its subject has seen the answer (`ScriptedLegRouter.answer`); a browser test
  awaits a locator.
- **A check that cannot fail proves nothing.** Before trusting a new audit,
  guard or analyzer, watch it fail once on a deliberate fault.
- **Browser tests read the map through `e2e/support/map.ts`**, the one place
  that knows how the sketch map is built, and tap it with `tapMap`, which
  finds bare map whichever way the panel is laid out.
- **The coverage floor** is in `vite.config.ts`, beside the list of files it
  leaves out: ports, wiring, and the adapters only a real browser can run.
  Anything with logic in it stays off that list.

## The iOS app

- **A trail leaves as GPX**, in the shape the app's own export writes, and the
  app imports it as it imports any GPX file.
- **A plan is meant to cross as a plan.** `planner/plan-document.ts` is the
  one encoded form of what a trail is drawn from: a format name, a version,
  a title and the stops. The app's `DrawnRoute` holds the same facts, so the
  app can open a web plan in its trail maker and route it again there. No app
  release reads it yet, so its version is still free to change; once one
  does, a change to the shape is a new version.
- **A stored trail keeps its stops** (`Trail.stops`), so a planned trail can
  be handed over as a plan long after it was saved.

## Settled decisions

- **MapKit JS is the map.** It is the only way to Apple's maps on the web, and
  search and walking directions come under the same token. A second real
  engine would double the work of every map feature, and the sketch map is
  not one: it has no tiles and no gestures.
- **No CSS framework and no component kit.** The design system is one token
  file and about ten components, which is less to own than either dependency.
- **A single-page app, with no server rendering.** There is a map and the
  browser's own storage, and nothing for a server to draw.
- **npm.** It ships with Node, so there is nothing to install first.
- **Trails live in the browser.** There is no account and no server. Reading
  the hiker's iCloud library is a separate decision, not a missing feature.

## Documentation

| File            | What it owns                                                  |
| --------------- | ------------------------------------------------------------- |
| `AGENTS.md`     | Commands, architecture, conventions, settled decisions        |
| `README.md`     | What the site is and how to run it. No engineering rationale. |
| `.env.example`  | The environment variables, and where a token comes from       |
| A file's header | Why that module is designed the way it is                     |

Open work is a GitHub issue, never a checked-in list.
