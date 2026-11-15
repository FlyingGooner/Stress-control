<div align="center">

<img src="icons/icon-192.png" width="88" alt="Task buddy icon">

# Task buddy

**Write it down – and let it go.**

### [▶ Open the app](https://flyinggooner.github.io/Stress-control/)

[📱 Presentation of the app](https://flyinggooner.github.io/Stress-control/docs/presentation.html)

</div>

<!-- Screenshots: put them in docs/ and show them here -->

## Why?

Things spinning in your head take energy. When a symptom, a job application or a house purchase is written down with the next step, you can let go of the thought – the app keeps track of it for you.

## Features

| | |
|---|---|
| 📋 **Threads** | Log what worries you or needs doing – with fields in a logical order, steps and a dated log. |
| 🩺 **Ready-made types** | Symptom, Task, Job application, Finances and Home – and more to switch on: Home purchase, Dental care, Worry, Authority, Insurance, Car, Studies, Calls. |
| 🧩 **Own types** | Create your own thread types with your own fields: text, date, time, number and checkboxes (e.g. House: Talked to the bank ✓, Mortgage approval ✓). |
| 🎨 **Categories** | Clear colours: pink Health, green Finances, blue Home, orange Work … – filter with one tap. |
| 👤 **People** | Who does what in the family, with own properties and working hours. |
| 🛟 **Social Insurance Agency** | Days at home with a sick child (VAB) or on parental leave, with hours away calculated (Swedish benefits). |
| 🗄️ **Close and archive** | Finished threads move to Archive and can be reopened. Recurring threads come back every month or year. |
| 📊 **Overview** | What is coming up, open threads per category and steps left. |
| 🌍 **Language** | English or Swedish, chosen at the first start and changeable in Settings. |
| ↩️ **Back** | The phone's back button closes what is open and goes back through the tabs. |
| 💾 **Backup** | Password-encrypted backup file with reminder. |
| 📴 **Offline** | Works without network after the first visit. |
| 🌗 **Theme** | Light and dark, follows the phone's setting. |

## Why your data is safer here 🛡️

This app holds your children's names, your health, your worries and your benefit claims. Here is why that is safer than in a typical app:

**Hacked company database** – the most common way sensitive data leaks

- Typical app with an account: Your data sits in a database with millions of others – a prime target
- **This app:** There is no database. Your data is only in your phone, so an attacker would have to get into *your* phone

**Your data is sold or shared**

- Typical app with an account: Common in free apps, and many paid ones share with partners for ads and analytics
- **This app:** No account, no analytics, no ads, no trackers – and the browser technically blocks every request out

**Employees or partners read it**

- Typical app with an account: Possible – the company holds the data
- **This app:** Nobody but you has it

**The company shuts down or is sold**

- Typical app with an account: Your data goes with it
- **This app:** The app and your data stay on your phone

**Backup in the cloud**

- Typical app with an account: Readable by the company
- **This app:** Encrypted with AES-256 and your password before it leaves the phone

**Is it the safest possible way?** For personal data like this, keeping it only on your own device, with no server and an encrypted backup, is as safe as a practical app gets – there is simply nothing central to steal. It is not magic, though: your phone itself must be locked and kept updated, the backup password must be strong, and you trust that the code served from GitHub Pages is the published, reviewed code (it is all open on GitHub for anyone to check).

## Privacy 🔒

- **No account, no cookies.** Everything is stored only in your browser (`localStorage`).
- **Nothing from outside.** No analytics, no ads, no fonts or scripts from outside – also blocked technically with a Content Security Policy.

## Install on your phone

**Android (Chrome)**
1. Open [the app](https://flyinggooner.github.io/Stress-control/) in Chrome.
2. Tap the menu **⋮** → **Install app** (or *Add to Home screen*).

**iPhone (Safari)**
1. Open [the app](https://flyinggooner.github.io/Stress-control/) in Safari.
2. Tap **Share** → **Add to Home Screen**.

The version number is shown at the top right of the app. New versions are fetched automatically.

## For developers

Plain HTML, CSS and JavaScript – no frameworks, no dependencies, no build step for the app.

**Run locally:** serve the folder statically, e.g. `python3 -m http.server 8080`, and open http://localhost:8080 (the service worker needs `localhost` or HTTPS).

**Test file:** `tools\build-single.ps1` bakes the app into a single file, `dist/stress-kontroll.html`, which can be opened directly in the browser or sent to someone.

| File | Contents |
|---|---|
| `index.html` | The app's markup |
| `styles.css`, `app.js`, `ui.js`, `nav.js`, `views/` | Style, router and clicks, shared state, Back logic, one file per view (ES modules) |
| `backup.js` | Encrypted backup file (shared) |
| `i18n.js`, `i18n-en.js` | Language support: the source text is Swedish; `i18n.js` (shared by all apps) translates what is drawn with the dictionary in `i18n-en.js` |
| `docs/MANUAL.md`, `docs/MANUAL.en.md` | The manual in Swedish and English – Help in the app is built from them (`tools/build-help.ps1`) |
| `docs/DATA.md` | The data model in `sk.data` and the export file |
| `tools/tests/` | Tests: Node (logic) and Edge (clicks in the test file), run by `tools/test.ps1` |
| `store.js` | Storage in `localStorage` and validation of saved data |
| `version.js` | Version number (single source) |
| `sw.js`, `manifest.webmanifest`, `icons/` | Installation as an app (PWA) and offline |
| `docs/SPEC.md` | Specification of features and behaviour |
| `docs/presentation.html` | Stand-alone mobile presentation of the app (Swedish by default, English with the button on the first slide) |
| `tools/build-single.ps1` | Builds the test file |
| `tools/test.ps1` | Runs the tests (`tools\test.ps1`, `ui` also builds the test file) |
| `tools/node-unit.mjs` | Runs `unit.test.js` in Node |
| `CLAUDE.md` | Rules for development |

Published to GitHub Pages from `main`.
