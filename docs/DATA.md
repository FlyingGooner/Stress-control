# Datamodell – Task buddy

All data ligger i `localStorage`. `sk.data` innehåller inställningar och öppna ärenden som JSON. Klara ärenden och papperskorgen ligger komprimerade i `sk.arch` (se Lagring nedan); modellen nedan är den hopslagna datan, samma som i exportfilen. Den valideras med `validate()` i `store.js` vid varje inläsning och import: ogiltiga delar hoppas över, inget kraschar. Ändras modellen ska `validate()`, `EXPORT_SCHEMA`/`EXPORT_EXAMPLE` (i `store.js`) och den här filen ändras tillsammans.

Gemensamt: id är `A–Z a–z 0–9 _ -`, högst 40 tecken (inte `__proto__`, `constructor`, `prototype`). Datum `ÅÅÅÅ-MM-DD` (2000–2100), datum och tid `ÅÅÅÅ-MM-DDTHH:MM`. Text rensas från styrtecken och kapas vid sin maxlängd. Tomma värden sparas inte.

## Toppnivå
| Nyckel | Typ | Beskrivning |
|---|---|---|
| `version` | tal | `22` (2026-11-22, appen omgjord; 21 hade kategorier, 22 bara färg – kategorins färg och namn flyttas till `k` och `labels`). Äldre data (typer, kategorier och fält) görs om vid inläsning och import, se nedan. |
| `labels` | objekt | Vad färgerna betyder, valfritt: `{ färg: namn ≤ 30 }`, färg = `pink green blue orange purple teal red gray`. |
| `people` | lista, ≤ 20 | Personer som kan utföra ett ärende: `{ id, name ≤ 30 }`. |
| `tpls` | lista, ≤ 100 | Mallar, som rätterna i Fitness buddy: `{ id, title ≤ 80, d?: beskrivning ≤ 4 000, s?: [delmål ≤ 80] }`. |
| `cases` | lista, ≤ 10 000 (varav ≤ 500 öppna) | Ärenden. Över taket behålls alla öppna och de senast klara. |
| `trash` | lista, ≤ 2 000 | Papperskorg: borttagna ärenden, samma form som ärenden plus `del` (borttagen datum). Id får inte finnas bland `cases`. |
| `trashDays` | 7 \| 30 \| 90 \| 365 \| 0 | Dagar i papperskorgen innan ärendet raderas vid start (0 = aldrig, standard 30). |
| `backup` | objekt | `{ remind: "week" \| "month" \| "off", last?: datum, asked?: datum }`. |

## Ärende (`cases[]`)
| Nyckel | Beskrivning |
|---|---|
| `id` | Ärendets id. |
| `title ≤ 80` | Rubrik, krävs. |
| `c`, `u` | Skapad och senast ändrad (datum, `u ≥ c`). |
| `x?` | Klart datum: ärendet ligger i Arkiv. |
| `k?` | Färg: en av `pink green blue orange purple teal red gray`. |
| `d?` | Beskrivning, ≤ 4 000 tecken, radbrytningar behålls. |
| `due?` | Deadline: datum (hela dagen) eller datum och tid. |
| `p?` | Person-id: vem som utför ärendet. Okänd person → tas bort. |
| `s?` | Delmål, ≤ 100 × `[text ≤ 80, 0 \| 1]`. |
| `l?` | Anteckningar, ≤ 200 × `[datum, text ≤ 2 000]`, äldst först. |

## Äldre data (version < 20)
Typer, kategorier, fält, upprepning och personers egenskaper finns inte längre. Varje gammal tråd blir ett ärende:
- Rubrik, skapad, ändrad, stängd (`x`), person och logg behålls. Sammanfattningen (`d`) blir början på beskrivningen.
- Ifyllda fält och extra fält skrivs som rader `Fältnamn: värde` i beskrivningen (bock = Ja, dagar = antal dagar).
- Deadline: typens slutdatum (`end`), annars ett fält markerat som deadline (`due`), annars närmaste öppna delmål med datum.
- Delmål behåller text och bock; ett datum skrivs inom parentes efter texten.
- Papperskorgens gamla borttagen-datum (`d`) blir `del`. Mallar skapas inte av de gamla typerna.

## Lagring
- `sk.data`: allt utom klara (arkiverade) ärenden och papperskorg, plus `arch: 1`. Skrivs vid varje ändring. Saknas `arch` är `sk.data` komplett och `sk.arch` ignoreras.
- `sk.arch`: `[stängda ärenden, papperskorg]` som JSON, komprimerat med deflate-raw (webbläsarens `CompressionStream`) och packat 15 bitar per tecken (tecken 0x20–0x801F): `Z<antal byte>:<tecken>`. Utan `CompressionStream` sparas `J<json>`.
- När arkivdelen ändras skrivs först hela datan okomprimerat till `sk.data`, sedan `sk.arch` och till sist den lilla `sk.data`. Stängs appen mitt i finns allt kvar.
- `sk.pwd`: sparat backup-lösenord, sparas första gången det skrivs (på som standard; `sk.pwdoff` = `1` när användaren bockat ur – då glöms det). Bara på enheten, aldrig i `sk.data` eller i backup-filen; Radera all data tar bort det.
- Oläsbar data skrivs aldrig över: den sparas under `sk.data.broken` eller `sk.arch.broken`.
- Uppmätt: 10 000 arkiverade + 100 öppna ärenden tar 1,1 M tecken (normala) till 3,6 M tecken (långa anteckningar) av cirka 5 M; okomprimerat 12–39 M.

## Exempel
```json
{ "version": 22, "labels": { "blue": "Hem" },
  "people": [{ "id": "p1", "name": "Anna" }],
  "tpls": [{ "id": "t1", "title": "Boka tandläkare", "s": ["Ring", "Gå dit"] }],
  "cases": [{ "id": "c1", "title": "Fixa markisen", "k": "blue", "d": "Klammer i kassetten", "due": "2026-12-01T09:00", "p": "p1",
    "c": "2026-11-10", "u": "2026-11-12", "s": [["Ring firman", 1], ["Boka tid", 0]], "l": [["2026-11-12", "Fick offert"]] }],
  "trash": [], "trashDays": 30, "backup": { "remind": "month" } }
```
