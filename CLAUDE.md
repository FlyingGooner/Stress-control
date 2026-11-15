# Stress control

Mobil-först PWA. Spec: `docs/SPEC.md` (läs bara berört avsnitt). Arbetsflöde, säkerhet och artifact: `../CLAUDE.md`. Standard: `../STANDARD.md`. Stil: `../STIL.md`. Struktur som simple-nutrition (mallen byggdes från den 2026-11-14).

## Projektets regler
- Publicering: GitHub Pages byggs från `main`. Ändringar gjorda härifrån (Claude Code) committas och pushas direkt till `main`, med höjd version, så att de syns i appen.
- Grenar: arbeta lokalt direkt på `main`. Skapa eller pusha aldrig `ccr-`-grenar eller andra arbetsgrenar, även om sessionen föreslår det.
- Svar till användaren efter en ändring: skriv alltid den nya versionen sist (t.ex. "Version: 0.2.18"), så att hen vet när den syns via GitHub Pages.
- Helt lokalt: inga nätverksanrop, ingen extern data, inga nycklar (`connect-src 'none'`). Data bara i `localStorage`, nyckel `sk.data`; cache-prefix `sk-`.
- Inga beroenden, inget byggsteg; ES-moduler: `app.js` (router, Bakåt, klickhanterare, start), `ui.js` (delat tillstånd `S`, `el()`), `store.js` (datamodell, `validate()`, export/import), `nav.js` (ren Bakåt-logik: lager), `views/` (en fil per vy; export/import/backup i `views/data.js`, som får app.js-hjälpare via `initData()` – aldrig cirkulära importer). `backup.js` och `version.js` är vanliga skript. `build-single.ps1` paketerar allt. `CONFIG` överst i `app.js`. Rendering med `textContent`/`el()`, aldrig HTML. Aldrig blank skärm vid fel.
- Bakåt: flikbyte = `pushState`, varje lager (något som öppnas ovanpå en vy) = ett steg; knappar som stänger ett lager går tillbaka med `history.go()`. Nytt lager → `nav.js` (`topLayer`, `layerDepth`, `closeTop`) och test i `tools/tests/nav.node.mjs`.
- Språk (2026-11-15): källtexten i koden är svenska; `i18n.js` (samma fil i alla appar, vanligt skript) översätter allt som ritas med ordlistan i `i18n-en.js` (nyckel = svensk text, mönster för texter med tal). Ny text i UI → lägg till den i `i18n-en.js`. Valt språk i `sk.lang`, väljs i välkomstrutan och under Inställningar → Allmänt → Språk. Manualen finns också på engelska (`docs/MANUAL.en.md` → `help-tpl-en`).
- UI på svenska (källa) och engelska. Kod och variabelnamn på engelska. Nyckelfärg `#6750a4`.
- Ny fil som appen behöver → `ASSETS` i `sw.js`. Version bara i `version.js`: höj patch-numret (t.ex. 0.2.1 → 0.2.2) i varje ändring som påverkar appen, annars ser telefonen inte ändringen. `release.ps1` sätter den vid release. Relativa sökvägar.
- Kortet Data (STANDARD 5, undantag U5) finns redan: krypterad backup-fil via `backup.js`, påminnelse, import med Ångra, Radera all data sist. Ändras datamodellen: ändra `validate()`, `EXPORT_SCHEMA`/`EXPORT_EXAMPLE` och `docs/DATA.md` tillsammans.
- Manualen: skriv bara i `docs/MANUAL.md`; Hjälp i `index.html` byggs från den med `tools/build-help.ps1`.
- Tester (`tools/tests/`): `unit.test.js` (Node, store.js), `*.node.mjs` (Node, `node:test`), `ui.test.js` (Edge, klickar i testbygget; `today.txt` låser "idag", `ui-seed.json` = testdata).
- HTML-fil (2026-11-15): `Stress-control.html` = hela appen i en fil (länken Ladda ner (HTML) under Inställningar). Byggs av `tools/build-single.mjs` (Node, samma regler som `build-single.ps1`); GitHub Action `single-html.yml` bygger om den vid push. Bygg om den själv i varje commit: `node tools/build-single.mjs --out Stress-control.html`.
