# Stress control – specifikation

## Idé
> Namn i appen: det som här kallas **ärende** heter **tråd** för användaren (Ärendetyp = Typ). I koden heter det `case`.

Ett enkelt ärendesystem för livet: logga det som oroar dig eller måste göras – ett symptom, en uppgift, en jobbansökan, ett husköp – med nästa steg, datum och anteckningar. Stäng ärendet när det är klart och få överblick över det som är kvar. Syftet är att kunna **släppa** saker: när de är nedskrivna med nästa steg behöver de inte snurra i huvudet.

## Mål
- Ett nytt ärende på några sekunder: välj typ, skriv en rubrik – resten kan fyllas i senare.
- Varje ärendetyp har lämpliga fält (kolumner) i en logisk ordning, t.ex. Symptom → datum → kontaktat vårdcentral → tid man ringde → tid hos vårdcentral → utfall → slutkommentar.
- Delmål som bockas av, och en logg med daterade anteckningar.
- Ärenden stängs och arkiveras – de finns kvar och kan öppnas igen.
- Överblick per kategori med tydliga färger (Hälsa rosa, Ekonomi grön, Hem blå …).
- Egna ärendetyper med egna fält (t.ex. Hus: adress, pris, visning, pratat med banken ✓, banken godkänt ✓).

## Icke-mål
- Inga nätverksanrop, inget konto, ingen synk, inga påminnelser via server.
- Inga bilagor/filer i ärenden (bara text).

## Begrepp
- **Ärende:** en sak att hantera. Har typ, rubrik, status (öppen/stängd), fältvärden, delmål och logg.
- **Ärendetyp:** mall för ärenden – namn, ikon, kategori och fält. Fasta typer finns från start; fler förslag kan slås på i Inställningar, och egna kan skapas.
- **Kategori:** färg och grupp (Hälsa, Ekonomi, Hem, Jobb, Relationer, Handla, Övrigt). Färgen väljs ur en fast palett.
- **Fält:** en kolumn i en typ. Sorter: text, lång text, datum, datum och tid, tal, bock (ja/nej).
- **Delmål:** en rad som bockas av. Typen kan ge förslag på delmål när ärendet skapas.

## Skärmar (bara mobil, 390 px)
```
┌──────────────────────────┐
│ Stress control   v0.1.0 │
│ [Alla][Hälsa][Ekonomi]…  │  filter per kategori (chips i kategorifärg)
│ ▌🩺 Ont i knät      2/4  │  färgad kant = kategori, delmål klara/alla
│ ▌   Symptom · 3 dagar    │
│ ▌💼 Utvecklare, Acme 1/3 │
│ [+ Nytt ärende]          │
├──────────────────────────┤
│ Ärenden  Överblick  Arkiv  Inst. │
└──────────────────────────┘
```
1. **Ärenden** (startvy): öppna ärenden, nyast ändrade först, filter per kategori. "+ Nytt ärende" öppnar typväljaren (ett lager): rubrik, typ, och den valda typens fält direkt under – allt i ett steg, "Skapa ärende" sparar.
2. **Ärende** (lager, Bakåt stänger): rubrik, typens fält i ordning, delmål (lägg till, bocka av, ta bort), logg (daterad anteckning), knappar Spara (stänger lagret, ärendet förblir öppet), Löst – arkivera / Öppna igen, Ta bort (bekräftelsedialog med antal loggrader och delmål, fokus på Avbryt, sedan ångra). Loggrader tas också bort via bekräftelse. Ändringar sparas direkt.
3. **Överblick:** antal öppna per kategori (färgade staplar), äldsta öppna, stängda senaste 30 dagarna, öppna delmål totalt.
4. **Arkiv:** stängda ärenden, senast stängda först, filter per kategori, sök i rubrik.
5. **Inställningar:** Ärendetyper (slå på/av förslag, skapa egen typ, ändra namn, kategori, fält), Kategorier (namn och färg), Papperskorg (visa – lager med filter, sammanfattning, återställ, radera; raderas automatiskt efter vald tid, standard 30 dagar; töm), Allmänt (Data, Hjälp).

## Datamodell
`localStorage`-nyckel `sk.data` (prefix `sk.`), validerad med `validate()` i `store.js`:
```
{ version: 1,
  cats:  [{ id, name ≤ 30, color: "pink"|"green"|"blue"|"orange"|"purple"|"teal"|"red"|"gray" }],
  types: [{ id, name ≤ 30, icon ≤ 4 tecken, cat: kategori-id, on: 0|1,
            fields: [{ id, name ≤ 40, kind: "text"|"note"|"date"|"dt"|"num"|"check" }] (≤ 20),
            steps?: [text ≤ 80] (förslag på delmål, ≤ 10) }],
  cases: [{ id, t: typ-id, title ≤ 80, c: skapad datum, u: ändrad datum, x?: stängd datum,
            f?: { fält-id: värde },            // tomma fält sparas inte
            s?: [[text ≤ 80, 0|1]],            // delmål
            l?: [[datum, text ≤ 500]] }],      // logg
  backup: { remind, last?, asked? } }
```
Komprimerat: korta nycklar, tomma fält utelämnas, delmål och logg som par. Gränser: 10 000 ärenden (högst 500 öppna), 2 000 i papperskorgen, 30 typer, 12 kategorier, 100 delmål och 50 loggrader per ärende (äldre data upp till 200 behålls). Fältvärden: text ≤ 200, lång text ≤ 2 000, datum `ÅÅÅÅ-MM-DD`, datum och tid `ÅÅÅÅ-MM-DDTHH:MM`, tal ±1e9, bock `1` (annars utelämnad).

### Fasta typer (påslagna från start)
| Typ | Kategori | Fält |
|---|---|---|
| 🩺 Symptom | Hälsa | Symptom, Började (datum), Kontaktat vården (bock), Ringde (datum och tid), Tid hos vården (datum och tid), Utfall av besök, Slutkommentar |
| ✅ Uppgift | Övrigt | Mål, Klart senast (datum) – delmål används |
| 💼 Jobbansökan | Jobb | Företag, Roll, Sökt (datum), Kontaktperson, Status, Intervju (datum och tid), Lön/villkor, Kommentar |
| 💸 Ekonomi | Ekonomi | Vad, Belopp (tal), Förfaller (datum), Betalt (bock), Kommentar |
| 🔧 Hemma | Hem | Vad, Vem fixar, Klart senast (datum), Kostnad (tal), Kommentar |
| 🛒 Inköp | Handla | Butik, Handla senast (datum), Kostnad (tal) – varorna är delmål (flera med komma, avbockade sist); upprepas varje vecka (`r: 'w'` på typen) |

### Förslag (av från start, slås på i Inställningar)
🏠 Bostadsköp (Hem: Adress, Pris, Visning, Pratat med banken ✓, Lånelöfte ✓, Bud, Tankar), 🦷 Tandvård (Hälsa), 🧠 Oro/tanke (Hälsa: Vad oroar, Värsta/troligaste utfall, Vad kan jag göra, Släppt ✓), 🏛️ Myndighet (Övrigt: Myndighet, Ärendenummer, Skickat, Svar senast, Svar), 🛡️ Försäkring (Ekonomi: Bolag, Skadenummer, Anmält, Ersättning), 🚗 Bil/verkstad (Hem), 🎓 Studier (Jobb), 💬 Samtal att ta (Relationer: Med vem, Om vad, Tagit samtalet ✓, Hur gick det).

### Export och import (STANDARD 5)
Som simple-nutrition: krypterad backup-fil, filen beskriver sitt format (`readme`, `schema`, `example`), import ersätter all data med Ångra.

## Datakälla och uppdatering
All data skrivs in av användaren och sparas bara i webbläsarens `localStorage` (nyckel `sk.data`). Inga nätverksanrop, ingen extern data. Backup som lösenordskrypterad fil (U5).

### Integritet och säkerhet
- CSP utan nätverk (`connect-src 'none'`), Trusted Types, ingen inline-kod. Rendering bara med `el()`/`textContent` – rubriker, fältnamn och anteckningar visas alltid som text.
- Kategorifärger är CSS-klasser ur en fast lista (`.c-pink` …) – inga färgvärden från data hamnar i stilar.
- `validate()` avvisar okända typ-/kategori-id, för långa texter och fel datumformat; `__proto__` m.fl. kan inte bli fält-id.
- `sw.js` cachar appens filer under `sk-<version>` och raderar bara egna cacher.

## PWA-krav
Manifest, ikoner, service worker, fungerar offline, installeras på Android och iPhone.

## Design
Material Design 3 enligt `../STIL.md` (beslut 2026-11-22, åter efter Apple-stilen 2026-11-21); bara menyraden nertill är genomskinligt glas, tonfärg `#6750a4` (lila). Kategorier i klara färger som i football-not-soccer: färgad kant på kortet och chip i kategorifärgen. Bottenmeny, bara mobil (390 px).

## Acceptanskriterier
- Skapa ett Symptom-ärende, fyll i fälten i ordning, bocka delmål, skriv logg, stäng → hamnar i Arkiv; öppna igen → tillbaka bland ärenden.
- Skapa en egen typ "Hus" med fält och en bock, skapa ärende av den.
- Bakåt stänger ärendet/typväljaren innan fliken byts.
- Export → import ger samma data. Ogiltig data i import hoppas över utan krasch.

## Framtida idéer
- Påminnelse om ärenden som legat orörda länge (lokalt, utan server).
- Sortera fält med dra-och-släpp. Statusfält med egna val.
