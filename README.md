# Leonida Legends — GTA VI Trophy Guide & Tracker

An offline guide and tracker for the **55 PlayStation 5 trophies of Grand Theft Auto VI**.
Static files under `app/` — no build step, no network at runtime. Open `app/index.html`
in any desktop browser, or serve it with any static HTTP server.

## What it does

- **Checklist of all 55 trophies** with the official PlayStation name, description and
  grade for each, plus a guide written for this entry in our own words.
- **Every guide cites its sources** (PowerPyx, Leonida Interactive, PSNProfiles and the
  official PlayStation descriptions) — named per trophy in the detail view.
- **Roadmap to the platinum** — six stages, from the five-chapter story through side
  strands, activities, crime one-offs, economy and 100% completion to the platinum.
- **Missable flags** — exactly one trophy (Positive Mental Attitude, the Chapter 1
  meditation) can be missed; it is flagged prominently on its card, in its guide and
  in the roadmap.
- **Progress tracker** — saved in the browser's localStorage; export it to a JSON file
  and import it back on another machine.
- **Filters** — by kind (story, activities, collectibles, crime, economy, special,
  completion, missable-only), by grade, by search text, and by earned/hidden state.
- **Spoiler setting** — hides the names and descriptions of story trophies until you
  have earned them, so the story stays a surprise.

## Layout

```
app/
  index.html        the page
  style.css         the look (original, no artwork, no network)
  app.js            the tracker (vanilla ES module)
  data/
    trophies.json   the 55 trophies: official name/description/grade + guide + sources
main.ts             hands the entry in: copies app/ and screenshots/ to /output, builds dossier.json
serve.ts            local dev server (node serve.ts → http://localhost:8080)
shots.json          screenshot metadata
screenshots/        4 real browser renders (the first by name is the cover)
vendor/makefun-frontend.ts  the kit's dossier library, unchanged
```

## Run it

```bash
node serve.ts            # serve app/ on http://localhost:8080
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # build the entry (copies to out/)
```

The app needs no network: every file it loads is a relative path under `app/`, and
progress lives in localStorage only.

## Sources

The official trophy names, descriptions and grades are as PlayStation publishes them
(as Exophase and PSNProfiles listed them). The guides are original text written for
this entry, drawing on:

- **PowerPyx** trophy guide and roadmap
- **Leonida Interactive** completion guide
- **PSNProfiles** / **Exophase** trophy listings
- **PlayStation** official trophy descriptions

No guide text is copied from any source; each trophy names its sources beside its guide.

## License

MIT (see LICENSE).
