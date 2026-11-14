# Stress kontroll – så använder du appen

Hjälp i appen (Inställningar → Hjälp och manual) byggs från den här filen med `tools/build-help.ps1`. Ändra bara här.

## Kom igång
- Det som snurrar i huvudet tar energi. Skriv ner det som en tråd med nästa steg – då kan du släppa tanken, appen håller reda på den.
- Tryck på en tråd i listan för att visa den. Där kan du bocka av delmål och skriva en anteckning direkt. Allt annat (rubrik, typ, fält, datum, ta bort, arkivera) ändrar du efter att ha tryckt ✎ Redigera. Pilen ▾ till höger fäller ut en sammanfattning (ifyllda fält, delmål, senaste anteckningar) utan att öppna tråden.
- Tryck + Ny tråd, skriv en rubrik (t.ex. Ont i knät) och välj typ. Typens fält visas direkt under – fyll i det du vet och tryck Skapa tråd. Tråden sparas som öppen i listan. Resten kan du fylla i senare.

## Trådar
- Varje typ har fält i en logisk ordning. Symptom: vad, när det började, om du kontaktat vården, när du ringde, tiden du fick, utfallet och en slutkommentar.
- Extra fält: tryck på "+ Extra fält" under fälten för att lägga till fält som bara gäller den tråden (t.ex. Pris), utan att ändra typen. Vill du ha dem permanent: tryck "+ Spara som ny typ" – en ny typ öppnas med typens fält plus de extra, och när du sparar flyttar tråden över till den.
- Fel typ? Byt den i listan överst i tråden. Alla typer som är påslagna i Inställningar finns med. Värden följer med till fält med samma namn. Fält som inte passar kan du behålla som extra fält eller ta bort. Extra fält flyttas in i fälten om du byter till en typ som har dem.
- Allt sparas direkt när du lämnar ett fält.
- Delmål bockar du av – dagens datum sparas då som klart-datum och syns bredvid delmålet; tryck på datumet för att ändra det. Har ett delmål inget datum: tryck på 📅 för att lägga till ett.
- Återkommande delmål, t.ex. Byt till vinterdäck i tråden Bilen: tryck på ↻ bredvid delmålet för att välja varje månad (↻ mån) eller varje år (↻ år). När du bockar av det blir det kvar som gjort, med datum, och ett nytt likadant delmål läggs in direkt under med datumet flyttat en månad eller ett år framåt (från delmålets datum, annars från idag). Bockar du ur igen tas det nya bort. Ett delmål kan få ett datum (när du lägger till det eller i efterhand); ej avbockade delmål med datum syns i Aktuellt och Kommande i Överblick, i rött om datumet passerat. Många typer lägger in förslag på delmål, t.ex. Ring vårdcentralen.
- Logg: skriv en kort anteckning, t.ex. Ringde, fick tid 18/11. Datumet är idag, men du kan välja ett tidigare datum om du skriver in något i efterhand – anteckningen hamnar då på rätt plats i loggen. Upp till 50 anteckningar per tråd.
- Färgen visar kategorin: rosa Hälsa, grön Ekonomi, blå Hem, orange Jobb, lila Relationer, grå Övrigt. Filtrera med knapparna överst.

## Stänga och arkivera
- Spara i redigeringen tar dig tillbaka till visningen av tråden, och ✕ där till listan. När tråden är löst: tryck Löst – arkivera. Den flyttas till Arkiv och finns kvar där. I Arkiv kan du filtrera per kategori och söka i rubriken. Arkivet visar 100 trådar åt gången – Visa fler längst ner. Ångra finns direkt efteråt.
- Återkommer något, som bilskatt eller service varje år? Välj Upprepa: Varje månad eller Varje år i tråden. När du arkiverar den skapas en ny öppen tråd med samma fält och delmål, där alla datum flyttats fram en månad eller ett år. Bockar och delmål nollställs, loggen följer inte med. Ångra tar bort den nya också, och det gör även Öppna igen så länge du inte börjat använda den nya.
- I Arkiv kan du söka och öppna en tråd igen.
- Vill du spara en tråd: arkivera den. Vill du bli av med den: Ta bort. Då hamnar den i Papperskorgen (Ångra finns också direkt efteråt).
- Papperskorgen finns under Inställningar → Papperskorg → Visa papperskorgen. Där kan du filtrera per kategori, fälla ut en tråd för att se innehållet, återställa den (den hamnar där den var, öppen eller i Arkiv) eller radera den för gott.
- Under Inställningar → Papperskorg väljer du också hur länge trådar ligger kvar innan de raderas automatiskt (7, 30, 90 dagar, 1 år eller Aldrig; standard 30 dagar), och där finns Töm papperskorgen.
- Rensa arkivet (Inställningar → Papperskorg): flytta arkiverade trådar som stängdes för mer än 1, 2, 5 eller 10 år sedan till papperskorgen.
- Arkivet och papperskorgen sparas komprimerade, så det ryms runt 10 000 arkiverade trådar (högst 500 öppna). Blir lagringen nästan full säger appen till.
- När appen startar visas öppna trådar direkt; arkivet läses in strax efter. Under tiden står det Läser in arkivet… i Arkiv, och backup, import och papperskorgen väntar tills det är klart.
- En loggrad tas bort efter en fråga, med Ångra efteråt.

## Överblick
- Antal öppna trådar per kategori, delmål som är kvar och hur många du stängt de senaste 30 dagarna. Allt går att trycka på: öppna trådar och en kategori visar listan (filtrerad), stängda visar Arkiv.
- Aktuellt (överst, röd siffra även på fliken): datum i öppna trådar inom påminnelsetiden (standard 7 dagar, ändras i Inställningar → Påminnelser) och deadlines som passerat. Det som är försenat, idag eller imorgon står först under Akut, i rött; resten under Snart. Tryck på en rad för att öppna tråden.
- Kommande: datum längre fram, uppdelat på Nästa vecka och Inom en månad.
- Tryck på "delmål kvar" för att se alla delmål som är kvar, med tråden de hör till. Delmål med datum står först. Bocka av direkt i listan (med Ångra), eller tryck på ett delmål för att öppna tråden.
- Deadline: i Inställningar → Typer kan varje datumfält bockas som deadline (t.ex. Klart senast, Förfaller). Då syns det i Aktuellt även när datumet passerat, tills tråden stängs.

## Typer och kategorier
- Inställningar → Trådar → Typer: bocka i fler typer, t.ex. Bostadsköp, Tandvård, Oro eller tanke, Myndighet, Försäkring, Bil och verkstad, Studier och Samtal att ta.
- + Egen typ: ge den namn, ikon (emoji) och kategori och lägg till fält. Sorter: text, lång text, datum, datum och tid, tal, bock, val i lista och dagar – t.ex. Hus med Adress, Pris, Visning, Pratat med banken ✓ och Lånelöfte ✓.
- Förslag på delmål (ett per rad, längst ner i typen) läggs in i varje ny tråd av typen. I Ny tråd syns förslagen under fälten, och du kan bocka ur dem du inte behöver. Listan över typer visar hur många delmål varje typ har.
- Tar du bort ett fält (eller byter dess sort) flyttas ifyllda värden till Extra fält i trådarna av typen – inget försvinner.
- Kategorier: byt namn och färg, eller lägg till nya.

## Försäkringskassan (VAB, föräldrapenning)
- Vad väljer du i en lista: VAB (tillfällig föräldrapenning), föräldrapenning, sjukpenning, sjukersättning, aktivitetsersättning, rehabiliteringspenning, graviditetspenning, närståendepenning med flera. Saknas det du söker: välj + Eget val… längst ner och skriv det. Det läggs då till i listan. Listan ändras också under Inställningar → Typer → Försäkringskassan.
- Typen Försäkringskassan har fältet Dagar. Lägg till varje dag du vabbat eller varit föräldraledig: välj datum, skriv hur många timmar du hann jobba (t.ex. 2, 2,5 eller 1:30, tomt = inget) och tryck +.
- Appen räknar ut hur många timmar du var borta: normal arbetsdag minus det du jobbade. Normal arbetsdag = personens arbetstid per vecka delat med 5 (40 tim/vecka = 8 tim/dag, 30 tim/vecka = 6 tim/dag). Ställ in tim/v per person under Inställningar → Trådar → Personer, och välj Vem utför i tråden. Utan person räknas 40 tim/vecka.
- Bocka av varje dag när du har ansökt. Listan visar t.ex. 1/2 ansökta, så du ser vad som är kvar. Arbetade timmar och ta bort en dag gör du under Redigera.

## Personer
- Inställningar → Trådar → Personer: lägg till de som kan utföra en tråd, t.ex. du själv, en partner eller en hantverkare. Byt namn direkt i listan; ✕ tar bort personen (med Ångra) och den tas då bort från alla trådar.
- Välj Vem utför när du skapar en tråd (under typens rubrik) eller i redigeringen. Personen syns i listan (👤) och överst i tråden. En återkommande tråd behåller personen.
- När någon tråd har en person visas en lista 👤 Alla först bland filterknapparna i Trådar och Arkiv. Välj en person, eller Ingen för trådar utan person. Den går att kombinera med kategorifiltret.
- Tim/v bredvid namnet är personens normala arbetstid per vecka (standard 40). Den används för timmar borta i Försäkringskassan.

## Bakåt
- Bakåt stänger det som är öppet (redigeringen, en tråd, typväljaren, en typ, delmålslistan eller en dialog) och går sedan tillbaka genom flikarna du besökt. Appen stängs först där du började.
- Svep åt vänster eller höger i Trådar för att byta filter (Alla, Hälsa, Hem …). Inte när en tråd eller ett formulär är öppet.

## Backup och flytt
- Under Inställningar → Allmänt → Data: tryck Spara backup-fil. Filen krypteras alltid med ett lösenord som du väljer, eller som appen skapar åt dig. Glömmer du lösenordet går filen inte att öppna.
- För att läsa tillbaka: tryck Läs in backup-fil, kontrollera sammanfattningen och tryck Ersätt. All nuvarande data ersätts – Ångra finns direkt efteråt.
- Appen påminner om backup varje månad (ändra under Data).
- Under Data ser du hur mycket lagring appen använder. Närmar den sig gränsen (cirka 5 MB): spara en backup-fil och ta bort gamla trådar.

- Backup-lösenordet sparas på enheten första gången du skriver det (när du sparar eller läser in en backup). Sedan sparas backup med ett tryck, utan fråga. Lösenordet ligger bara på den här enheten, aldrig i backup-filen, och filen är lika krypterad som förut. Bockar du i Visa lösenord räcker det att skriva lösenordet en gång. Under Inställningar → Data kan du Visa och Byta lösenordet, eller bocka ur Kom ihåg backup-lösenordet – då glöms det och appen frågar varje gång. Använd ett nytt lösenord som du inte har någon annanstans: det sparas oskyddat på den här enheten. Tryck **Skapa slumpmässigt lösenord** och spara det i din lösenordshanterare. Behåll lösenordet i din lösenordshanterare – utan det går backupen inte att öppna på en ny telefon.
- Appen är låst tills du har valt ett lösenord för dina backup-filer – första gången, efter Radera all data och så länge inget lösenord är sparat. Har du en backup-fil kan du läsa in den i stället; lösenordet som öppnar den sparas. Appen samlar ingen data – lösenordet är bara en nyckel som skyddar dina backuper. Läser du in en backup som det sparade lösenordet låser upp står det i sammanfattningen; passar det inte frågar appen efter lösenordet för den filen.
## Installera och offline
- Android (Chrome): menyn ⋮ → Installera app. iPhone (Safari): Dela → Lägg till på hemskärmen. Appen fungerar sedan utan nät.
- På iPhone: installera appen på hemskärmen. Safari kan annars rensa sparad data för sidor du inte besökt på ett tag. Spara en backup-fil regelbundet ändå.

## Integritet
- Appen gör inga anrop – ingen server, ingen analys, inget konto. Allt du skriver finns bara i den här telefonen.
