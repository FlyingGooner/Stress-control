# Datamodell – Stress kontroll

All data ligger i `localStorage` under nyckeln `sk.data`, som JSON. Den valideras med `validate()` i `store.js` vid varje inläsning och import: ogiltiga delar hoppas över, inget kraschar. Ändras modellen ska `validate()`, `EXPORT_SCHEMA`/`EXPORT_EXAMPLE` (i `store.js`) och den här filen ändras tillsammans.

Gemensamt: id är `A–Z a–z 0–9 _ -`, högst 40 tecken (inte `__proto__`, `constructor`, `prototype`). Datum `ÅÅÅÅ-MM-DD` (2000–2100), datum och tid `ÅÅÅÅ-MM-DDTHH:MM`. Text rensas från styrtecken och kapas vid sin maxlängd. Tomma värden sparas inte.

## Toppnivå
| Nyckel | Typ | Beskrivning |
|---|---|---|
| `version` | tal | `2`. Version 1 saknade deadline-markering; vid inläsning markeras då standardtypernas deadline-fält. |
| `alertDays` | 1 \| 3 \| 7 \| 14 \| 30 | Hur många dagar framåt Aktuellt visar (standard 7). |
| `cats` | lista, 1–12 | Kategorier. |
| `types` | lista, 1–30 | Ärendetyper. |
| `cases` | lista, ≤ 2 000 | Ärenden. |
| `backup` | objekt | `{ remind: "week" \| "month" \| "off", last?: datum, asked?: datum }`. |

## Kategori (`cats[]`)
`{ id, name ≤ 30, color }` – `color` är en av `pink green blue orange purple teal red gray` (annars `gray`).

## Ärendetyp (`types[]`)
| Nyckel | Beskrivning |
|---|---|
| `id`, `name ≤ 30`, `icon ≤ 8 tecken` | Saknas ikon blir den 📌. |
| `cat` | Kategori-id; okänt → första kategorin. |
| `on` | `1` = syns i Nytt ärende, `0` = av (förslag). |
| `fields` | ≤ 20 × `{ id, name ≤ 40, kind, due? }`. `kind`: `text` (≤ 200), `note` (≤ 2 000, radbrytningar), `date`, `dt`, `num` (±1e9, två decimaler), `check` (`1`). `due: 1` = deadline (bara `date`/`dt`): syns i Aktuellt även när den passerats. |
| `steps?` | ≤ 10 texter ≤ 80: förslag på delmål när ett ärende skapas. |

## Ärende (`cases[]`)
| Nyckel | Beskrivning |
|---|---|
| `id`, `t` | Ärendets id och typ-id (okänd typ → ärendet hoppas över). |
| `title ≤ 80` | Rubrik, krävs. |
| `c`, `u` | Skapad och senast ändrad (datum, `u ≥ c`). |
| `x?` | Stängd (arkiverad) datum. |
| `r?` | Upprepa: `m` = varje månad, `y` = varje år. När ärendet arkiveras skapas ett nytt öppet ärende med samma typ, rubrik och fält; alla datum (fält, extra fält, delmål) flyttas en månad eller ett år (31 jan → 28/29 feb). Bockar och delmål nollställs, loggen följer inte med. |
| `f?` | `{ fält-id: värde }` efter typens fält. Värden för fält som inte finns i typen tas bort vid validering. |
| `o?` | Extra fält bara i ärendet, ≤ 20 × `[namn ≤ 40, kind, värde \| null, från-typ ≤ 30 eller ""]`. Tillagda för hand, kvar från en tidigare typ, eller flyttade hit när ett fält togs bort ur typen. |
| `s?` | Delmål, ≤ 50 × `[text ≤ 80, 0 \| 1, datum?]`. Ett ej avbockat delmål med datum är en deadline i Aktuellt. |
| `l?` | Logg, ≤ 200 × `[datum, text ≤ 500]` (de senaste behålls). |

## Exempel
```json
{ "version": 2, "alertDays": 7,
  "cats": [{ "id": "e", "name": "Ekonomi", "color": "green" }],
  "types": [{ "id": "eco", "name": "Ekonomi", "icon": "💸", "cat": "e", "on": 1,
              "fields": [{ "id": "wh", "name": "Vad", "kind": "text" }, { "id": "du", "name": "Förfaller", "kind": "date", "due": 1 }] }],
  "cases": [{ "id": "c1", "t": "eco", "title": "Bilskatt", "c": "2026-11-01", "u": "2026-11-01", "r": "y",
              "f": { "wh": "Skatt", "du": "2026-11-30" }, "s": [["Betala", 0, "2026-11-28"]], "l": [["2026-11-01", "Fick avin"]] }],
  "backup": { "remind": "month" } }
```

## Export och import
Exportfilen (krypterad med `backup.js`) innehåller `app: "stress-kontroll"`, `format: 1`, `exported`, `appVersion`, `readme`, `schema`, `example` och `data` (modellen ovan). Import ersätter all data, med Ångra.
