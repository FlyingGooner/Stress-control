# Stress kontroll – så använder du appen

Hjälp i appen (Inställningar → Hjälp och manual) byggs från den här filen med `tools/build-help.ps1`. Ändra bara här.

## Kom igång
- Det som snurrar i huvudet tar energi. Skriv ner det som ett ärende med nästa steg – då kan du släppa tanken, appen håller reda på den.
- Tryck på ett ärende i listan för att öppna det. Pilen ▾ till höger fäller ut en sammanfattning (ifyllda fält, delmål, senaste anteckningar) utan att öppna ärendet.
- Tryck + Nytt ärende, skriv en rubrik (t.ex. Ont i knät) och välj typ. Typens fält visas direkt under – fyll i det du vet och tryck Skapa ärende. Ärendet sparas som öppet i listan. Resten kan du fylla i senare.

## Ärenden
- Varje typ har fält i en logisk ordning. Symptom: vad, när det började, om du kontaktat vården, när du ringde, tiden du fick, utfallet och en slutkommentar.
- Extra fält: längst ner bland fälten i ett ärende kan du lägga till fält som bara gäller det ärendet (t.ex. Pris), utan att ändra typen. Vill du ha dem permanent: tryck "+ Spara som ny ärendetyp" – en ny typ öppnas med typens fält plus de extra, och när du sparar flyttar ärendet över till den.
- Fel typ? Byt den i listan överst i ärendet. Alla typer som är påslagna i Inställningar finns med. Värden följer med till fält med samma namn. Fält som inte passar kan du behålla som extra fält eller ta bort. Extra fält flyttas in i fälten om du byter till en typ som har dem.
- Allt sparas direkt när du lämnar ett fält.
- Delmål bockar du av. Ett delmål kan få ett datum (när du lägger till det eller i efterhand); ej avbockade delmål med datum syns i Aktuellt och Kommande i Överblick, i rött om datumet passerat. Många typer lägger in förslag på delmål, t.ex. Ring vårdcentralen.
- Logg: skriv en kort anteckning med dagens datum, t.ex. Ringde, fick tid 18/11.
- Färgen visar kategorin: rosa Hälsa, grön Ekonomi, blå Hem, orange Jobb, lila Relationer, grå Övrigt. Filtrera med knapparna överst.

## Stänga och arkivera
- Spara tar dig tillbaka till listan, ärendet ligger kvar som öppet. När ärendet är löst: tryck Löst – arkivera. Det flyttas till Arkiv och finns kvar där. I Arkiv kan du filtrera per kategori och söka i rubriken. Arkivet visar 100 ärenden åt gången – Visa fler längst ner. Ångra finns direkt efteråt.
- Återkommer något, som bilskatt eller service varje år? Välj Upprepa: Varje månad eller Varje år i ärendet. När du arkiverar det skapas ett nytt öppet ärende med samma fält och delmål, där alla datum flyttats fram en månad eller ett år. Bockar och delmål nollställs, loggen följer inte med. Ångra tar bort det nya också, och det gör även Öppna igen så länge du inte börjat använda det nya.
- I Arkiv kan du söka och öppna ett ärende igen.
- Vill du spara ett ärende: arkivera det. Vill du bli av med det: Ta bort. Då hamnar det i Papperskorgen (Ångra finns också direkt efteråt).
- Papperskorgen finns under Inställningar → Papperskorg → Visa papperskorgen. Där kan du filtrera per kategori, fälla ut ett ärende för att se innehållet, återställa det (det hamnar där det var, öppet eller i Arkiv) eller radera det för gott.
- Under Inställningar → Papperskorg väljer du också hur länge ärenden ligger kvar innan de raderas automatiskt (7, 30, 90 dagar, 1 år eller Aldrig; standard 30 dagar), och där finns Töm papperskorgen.
- Rensa arkivet (Inställningar → Papperskorg): flytta arkiverade ärenden som stängdes för mer än 1, 2, 5 eller 10 år sedan till papperskorgen.
- Arkivet och papperskorgen sparas komprimerade, så det ryms runt 10 000 arkiverade ärenden (högst 500 öppna). Blir lagringen nästan full säger appen till.
- En loggrad tas bort efter en fråga, med Ångra efteråt.

## Överblick
- Antal öppna ärenden per kategori, delmål som är kvar och hur många du stängt de senaste 30 dagarna.
- Aktuellt (överst, röd siffra även på fliken): datum i öppna ärenden inom påminnelsetiden (standard 7 dagar, ändras i Inställningar → Påminnelser) och deadlines som passerat. Det som är försenat, idag eller imorgon står först under Akut, i rött; resten under Snart. Tryck på en rad för att öppna ärendet.
- Kommande: datum längre fram, uppdelat på Nästa vecka och Inom en månad.
- Tryck på "delmål kvar" för att se alla delmål som är kvar, med ärendet de hör till. Delmål med datum står först. Bocka av direkt i listan (med Ångra), eller tryck på ett delmål för att öppna ärendet.
- Deadline: i Inställningar → Ärendetyper kan varje datumfält bockas som deadline (t.ex. Klart senast, Förfaller). Då syns det i Aktuellt även när datumet passerat, tills ärendet stängs.

## Ärendetyper och kategorier
- Inställningar → Ärenden → Ärendetyper: bocka i fler typer, t.ex. Bostadsköp, Tandvård, Oro eller tanke, Myndighet, Försäkring, Bil och verkstad, Studier och Samtal att ta.
- + Egen ärendetyp: ge den namn, ikon (emoji) och kategori och lägg till fält. Sorter: text, lång text, datum, datum och tid, tal och bock – t.ex. Hus med Adress, Pris, Visning, Pratat med banken ✓ och Lånelöfte ✓.
- Förslag på delmål (ett per rad, längst ner i typen) läggs in i varje nytt ärende av typen. I Nytt ärende syns förslagen under fälten, och du kan bocka ur dem du inte behöver. Listan över typer visar hur många delmål varje typ har.
- Tar du bort ett fält (eller byter dess sort) flyttas ifyllda värden till Extra fält i ärendena av typen – inget försvinner.
- Kategorier: byt namn och färg, eller lägg till nya.

## Bakåt
- Bakåt stänger det som är öppet (ett ärende, typväljaren, en ärendetyp, delmålslistan eller en dialog) och går sedan tillbaka genom flikarna du besökt. Appen stängs först där du började.
- Svep åt vänster eller höger i Ärenden för att byta filter (Alla, Hälsa, Hem …). Inte när ett ärende eller formulär är öppet.

## Backup och flytt
- Under Inställningar → Allmänt → Data: tryck Spara backup-fil. Filen krypteras alltid med ett lösenord som du väljer, eller som appen skapar åt dig. Glömmer du lösenordet går filen inte att öppna.
- För att läsa tillbaka: tryck Läs in backup-fil, kontrollera sammanfattningen och tryck Ersätt. All nuvarande data ersätts – Ångra finns direkt efteråt.
- Appen påminner om backup varje månad (ändra under Data).
- Under Data ser du hur mycket lagring appen använder. Närmar den sig gränsen (cirka 5 MB): spara en backup-fil och ta bort gamla ärenden.

## Installera och offline
- Android (Chrome): menyn ⋮ → Installera app. iPhone (Safari): Dela → Lägg till på hemskärmen. Appen fungerar sedan utan nät.
- På iPhone: installera appen på hemskärmen. Safari kan annars rensa sparad data för sidor du inte besökt på ett tag. Spara en backup-fil regelbundet ändå.

## Integritet
- Appen gör inga anrop – ingen server, ingen analys, inget konto. Allt du skriver finns bara i den här telefonen.
