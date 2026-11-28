# Task buddy – så använder du appen

Hjälp i appen (Inställningar → Hjälp och manual) byggs från den här filen med `tools/build-help.ps1`. Ändra bara här.

## Kom igång
- Skriv ner det som snurrar i huvudet som ett ärende. Då kan du släppa tanken, appen håller reda på den.
- Tryck + Nytt ärende. Ett tomt ärende öppnas direkt – skriv en rubrik (t.ex. Fixa markisen), så sparas det. Har du mallar står de under rubriken.
- Varje ärende har en rubrik, en kort beskrivning, en deadline (datum och, om du vill, klockslag), delmål och anteckningar. Allt sparas direkt när du lämnar ett fält.

## Ärenden
- Listan visar öppna ärenden med närmast deadline först. Passerade deadlines står i rött, dagens i lila. Ärenden utan deadline hamnar sist.
- Den röda siffran på fliken Ärenden visar hur många som har deadline idag eller som har passerat.
- Ett ärende öppnas i läsläge: rubrik, deadline, vem, beskrivning, delmål och anteckningar som en överskådlig sammanfattning. Du kan bocka av delmål och lägga till en anteckning direkt. Tryck ✎ Ändra för att ändra resten, och Klar med ändringarna för att gå tillbaka till läsläget. Ett nytt ärende öppnas direkt i redigeringsläget.
- Beskrivning: klistra gärna in en längre text, t.ex. en sammanfattning med telefonnummer och pris. Rutan växer med texten.
- Deadline: välj datum. Klockslaget är valfritt. ✕ tar bort deadline.
- Delmål: skriv och tryck Lägg till. Bocka av när de är klara. Siffran i listan (t.ex. 1/3) visar hur många som är klara.
- Anteckningar: skriv vad som hänt, t.ex. Ringde, fick tid 18/11. Den får dagens datum och hamnar överst. Du kan ändra en anteckning direkt i rutan.

## Kalender
- Fliken Kalender visar en månad i taget. Varje ärende med deadline syns som en prick i ärendets färg på sin dag. Klara ärenden är en tom ring, försenade dagar har rött datum.
- Under kalendern står alla ärenden med deadline den månaden, i datumordning. Tryck på en dag för att bara se den dagen, och tryck på dagen igen (eller Hela månaden) för att se hela månaden. Tryck på ett ärende för att öppna det.
- Svep åt sidan på kalendern, eller tryck ◀ och ▶, för att byta månad. Tryck på månadens namn för att komma tillbaka till idag.

## Färg
- Tryck på 🎨 (eller färgpricken) uppe till höger i ärendet och välj en färg. ⊘ tar bort färgen.
- Skriv vad färgen betyder i rutan under färgerna (t.ex. Hem), eller under Inställningar → Ärenden → Färger. Det gäller alla ärenden med den färgen och syns bredvid färgen i väljaren, bredvid pricken i ärendet, i listan och i filtret.
- Ärendet har färgen som ram runt om.
- Listan kan filtreras på färg.

## Mallar
- Mallar fungerar som rätterna i Fitness buddy. Har du ett ärende som återkommer, tryck Spara som mall längst ner i ärendet. Rubrik, beskrivning och delmål sparas.
- Under + Nytt ärende finns dina mallar. Tryck på en mall för att starta ett nytt ärende med beskrivning och delmål ifyllda. Har du skrivit en rubrik används den, annars mallens.
- Sparar du en mall med samma rubrik som en befintlig ersätts den.
- Byt namn på eller ta bort mallar under Inställningar → Ärenden → Mallar.

## Klart och arkiv
- När ärendet är löst: tryck ✓ Klar. Det flyttas till Arkiv. Ångra finns direkt efteråt.
- När du bockar av det sista delmålet frågar appen om ärendet ska markeras klart (Markera klart).
- Överst i Ärenden står hur många ärenden som är försenade och hur många som ska vara klara idag.
- I Arkiv kan du söka i rubrik, beskrivning, delmål och anteckningar, och öppna ett ärende igen med Öppna igen (Ångra finns).
- Ta bort flyttar ärendet till Papperskorgen (Inställningar → Ärenden → Papperskorg). Där kan du återställa det eller radera det för gott. Du väljer hur länge ärenden ligger kvar innan de raderas automatiskt.

## Personer
- Lägg till personer under Inställningar → Ärenden → Personer. Då kan du välja vem som gör ett ärende och filtrera listan på person.
- Tar du bort en person försvinner den från alla ärenden. Ångra finns direkt efteråt.

## Tidigare version
- Appen gjordes om 2026-11-22. Typer, kategorier och fält finns inte längre. Dina gamla trådar finns kvar som ärenden: ifyllda fält står nu som rader i beskrivningen, och ett datum som var slutdatum eller deadline blev ärendets deadline.

## Bakåt
- Bakåt stänger det som är öppet (ett ärende, Nytt ärende, papperskorgen eller en dialog) och går sedan tillbaka genom flikarna du besökt. Appen stängs först där du började.

## Varför din data är säker här
- Här finns det som snurrar i huvudet: ärenden, kontakter och vem i familjen som gör vad. Sådant ska inte hamna hos ett företag, en annonsör eller en hackare.
- **Ingen server att hacka.** De flesta stora läckor sker när ett företags databas med miljontals användares uppgifter hackas. Här finns ingen sådan databas: din data finns bara i din telefon. Den som vill åt den måste komma åt just din telefon.
- **Inget att sälja.** Många gratisappar – och även betalappar – tjänar pengar på din data eller delar den med partner för annonser och analys. Den här appen har inget konto, ingen analys, ingen reklam och inga spårare. Webbläsaren spärrar dessutom tekniskt alla anrop ut, så datan kan inte skickas iväg ens av misstag.
- **Låst backup.** Backup-filen krypteras med AES-256 och ditt lösenord. Lägger du den i molnet ser molntjänsten bara obegriplig data.
- **Öppen kod.** All kod ligger öppet på GitHub och kan granskas av vem som helst.
- **Ärligt: inget är 100 % säkert.** Det som återstår är din egen telefon – lås den med kod och håll den uppdaterad – ett svagt backup-lösenord, och att appens kod på GitHub Pages inte ändras av någon obehörig. Men för den här sortens uppgifter finns inget säkrare praktiskt sätt än att de aldrig lämnar telefonen.

## Språk
- Appen är på svenska från början. Byt språk under Inställningar → Allmänt → Språk. Din data är densamma på båda språken; det du själv skriver översätts inte.

## Backup och flytt
- Under Inställningar → Allmänt → Data: tryck Spara backup-fil. Filen krypteras alltid med ett lösenord – din kod, som appen skapar åt dig.
- För att läsa tillbaka: tryck Läs in backup-fil, kontrollera sammanfattningen och tryck Ersätt. All nuvarande data ersätts – Ångra finns direkt efteråt.
- Appen påminner om backup varje månad (ändra under Data).
- Under Data ser du hur mycket lagring appen använder. Närmar den sig gränsen (cirka 5 MB): spara en backup-fil och ta bort gamla ärenden.

- Backup-filen låses alltid med **din kod**: 16 slumpade tecken som appen skapar åt dig första gången den startas och sparar på enheten. Vill du hellre använda en egen kod (t.ex. samma i alla dina appar) trycker du **Välj egen kod** – den måste ha minst 16 tecken med stor och liten bokstav, siffra och specialtecken, samma krav som den skapade. Backup sparas med ett tryck. Under Inställningar → Data finns Din kod: **Visa**, **Kopiera** och **Ny kod**. Spara koden i din lösenordshanterare – på en ny telefon (eller efter Radera all data) behöver du den för att öppna en backup. Läser du in en backup med en annan kod används den koden sedan för nya backuper. Ny kod gör att gamla backup-filer bara öppnas med den gamla koden (Ångra finns). Appen samlar ingen data – koden är bara en nyckel som skyddar dina backuper.
## Installera som app

![Android: Chrome-menyn ⋮ → Installera app](manual/install-android.png)
- **Android (Chrome):** öppna appens länk, tryck ⋮ uppe till höger och välj **Installera app**.

![iPhone: Safari → Dela → Lägg till på hemskärmen](manual/install-ios.png)
- **iPhone (Safari):** öppna länken i Safari, tryck **Dela** (rutan med pilen) och välj **Lägg till på hemskärmen** → **Lägg till**.
- Installerad fungerar appen som en vanlig app, även utan nät.

## Integritet
- Appen gör inga anrop – ingen server, ingen analys, inget konto. Allt du skriver finns bara i den här telefonen.
