<div align="center">

<img src="icons/icon-192.png" width="88" alt="Stress kontroll-ikon">

# Stress kontroll

**Skriv ner det – och släpp det.**

### [▶ Öppna appen](https://flyinggooner.github.io/Stress-control/)

[📱 Presentation av appen](https://flyinggooner.github.io/Stress-control/docs/presentation.html)

</div>

<!-- Skärmbilder: lägg i docs/ och visa här -->

## Varför?

Saker som snurrar i huvudet tar energi. När ett symptom, en jobbansökan eller ett husköp finns nedskrivet med nästa steg kan du släppa tanken – appen håller reda på den åt dig.

## Funktioner

| | |
|---|---|
| 📋 **Ärenden** | Logga det som oroar dig eller måste göras – med fält i en logisk ordning, delmål och en daterad logg. |
| 🩺 **Färdiga typer** | Symptom, Uppgift, Jobbansökan, Ekonomi och Hemma – och fler att slå på: Bostadsköp, Tandvård, Oro, Myndighet, Försäkring, Bil, Studier, Samtal. |
| 🧩 **Egna typer** | Skapa egna ärendetyper med egna fält: text, datum, tid, tal och bockar (t.ex. Hus: Pratat med banken ✓, Lånelöfte ✓). |
| 🎨 **Kategorier** | Klara färger: rosa Hälsa, grön Ekonomi, blå Hem, orange Jobb … – filtrera med ett tryck. |
| 🗄️ **Stäng och arkivera** | Klara ärenden flyttas till Arkiv och kan öppnas igen. |
| 📊 **Överblick** | Öppna ärenden per kategori, delmål kvar och äldsta öppna. |
| ↩️ **Bakåt** | Telefonens bakåtknapp stänger det som är öppet och går tillbaka genom flikarna. |
| 💾 **Backup** | Lösenordskrypterad backup-fil med påminnelse. |
| 📴 **Offline** | Fungerar utan nät efter första besöket. |
| 🌗 **Tema** | Ljust och mörkt, följer telefonens inställning. |

## Integritet 🔒

- **Inget konto, inga cookies.** Allt sparas bara i din webbläsare (`localStorage`).
- **Inget utifrån.** Ingen analys, inga annonser, inga typsnitt eller skript utifrån – spärras även tekniskt med en Content Security Policy.

## Installera på mobilen

**Android (Chrome)**
1. Öppna [appen](https://flyinggooner.github.io/Stress-control/) i Chrome.
2. Tryck på menyn **⋮** → **Installera app** (eller *Lägg till på startskärmen*).

**iPhone (Safari)**
1. Öppna [appen](https://flyinggooner.github.io/Stress-control/) i Safari.
2. Tryck på **Dela** → **Lägg till på hemskärmen**.

Versionsnumret syns uppe till höger i appen. Nya versioner hämtas automatiskt.

## För utvecklare

Ren HTML, CSS och JavaScript – inga ramverk, inga beroenden, inget byggsteg för appen.

**Köra lokalt:** servera mappen statiskt, t.ex. `python3 -m http.server 8080`, och öppna http://localhost:8080 (service workern kräver `localhost` eller HTTPS).

**Testfil:** `tools\build-single.ps1` bakar ihop appen till en enda fil, `dist/stress-kontroll.html`, som går att öppna direkt i webbläsaren eller skicka till någon.

| Fil | Innehåll |
|---|---|
| `index.html` | Appens markup |
| `styles.css`, `app.js`, `ui.js`, `nav.js`, `views/` | Stil, router och klick, delat tillstånd, Bakåt-logik, en fil per vy (ES-moduler) |
| `backup.js` | Krypterad backup-fil (gemensam) |
| `docs/MANUAL.md` | Manualen – Hjälp i appen byggs från den (`tools/build-help.ps1`) |
| `docs/DATA.md` | Datamodellen i `sk.data` och exportfilen |
| `tools/tests/` | Tester: Node (logik) och Edge (klick i testfilen), körs av `tools/test.ps1` |
| `store.js` | Lagring i `localStorage` och validering av sparad data |
| `version.js` | Versionsnummer (enda källan) |
| `sw.js`, `manifest.webmanifest`, `icons/` | Installation som app (PWA) och offline |
| `docs/SPEC.md` | Specifikation av funktioner och beteende |
| `docs/presentation.html` | Fristående mobilpresentation av appen |
| `tools/build-single.ps1` | Bygger testfilen |
| `tools/test.ps1` | Kör testerna (`tools\test.ps1`, `ui` bygger även testfilen) |
| `tools/node-unit.mjs` | Kör `unit.test.js` i Node |
| `CLAUDE.md` | Regler för utveckling |

Publiceras till GitHub Pages från `main`.
