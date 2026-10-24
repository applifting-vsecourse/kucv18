# Moderace: admin maže cizí quacky

## User story

Jako moderátor (admin) chci smazat jakýkoli quack, abych mohl odstranit nevhodné příspěvky, které jejich autor nesmaže.

## Kontext

Někdo začal přidávat nechutné quacky a jejich autor je nesmaže. Potřebujeme moderátora, který smaže cokoli. Nic víc. Moderátor je uživatel s rolí `admin`, ta už existuje. Účet je ze seedu (`admin@example.com`).

## Akceptační kritéria

Mazání

- Admin vidí akci Delete u každého quacku, ne jen u svých.
- Běžný uživatel dál vidí Delete jen u svých quacků.
- Admin mazání potvrzuje stejným dialogem jako autor. Text se nemění.
- Po smazání quack zmizí z feedu (All i Mine).

Server

- Smazat quack smí jeho autor nebo admin. Kdokoli jiný dostane 403, a to i při přímém volání API.
- Odhlášený dostane 401, neexistující quack 404.
- Roli bere server ze session. Ne z URL ani z těla požadavku.
- Kontrola je na jednom místě ve službě: `isOwner || isAdmin`.

Mine

- Záložka Mine se pro admina nemění: ukazuje jen jeho vlastní quacky.

## Rozhodnutí z upřesňování

- Dialog pro admina je stejný jako pro autora.
- Záložka Mine zůstává beze změny.
- Role `moderator` a stránka Stats nejsou součástí tohoto úkolu.

## Mimo rozsah

- Samostatná role `moderator`, log moderačních akcí, vrácení smazaného (undo).
- Okamžité zmizení quacku ostatním divákům (uvidí změnu při příštím načtení).

## Jak to ověřit

1. Autor smaže svůj quack. Funguje.
2. Jiný běžný uživatel nevidí Delete u cizího quacku. API vrací 403.
3. `admin@example.com` vidí Delete u každého quacku a cizí quack smaže.
4. Odhlášený: `DELETE` vrací 401.
