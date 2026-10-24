# Story: ankety

> Stav: hotovo a zmergováno (PR #8). Zachováno pro historii. Aktuální story je v `story.md`.

## Problém

Lidé se v quacích ptají ("kam půjdeme na oběd?") a odpovědi pak počítají ručně. Někdo se vždycky splete a quack zapadne pod odpověďmi.

## Co stavíme

Quack může obsahovat anketu: několik odpovědí na výběr. Ostatní vyberou jednu a u každé odpovědi se zobrazí, kolik lidí ji zvolilo. Nejdřív chceme zjistit, jestli to lidé budou používat, proto je rozsah záměrně malý.

## Rozhodnutí (všechna uzavřená)

| Téma                     | Rozhodnutí                                                                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kde anketa žije          | Anketa je druh quacku. Zobrazuje se v běžném quack feedu. Žádná samostatná stránka anket.                                                                        |
| Vytváření                | Formulář quacku má přepínač "Add a poll", který odhalí pole pro odpovědi. Text quacku je otázka. Nálada zůstává volitelná.                                       |
| Odpovědi                 | 2 až 6 odpovědí, každá max 80 znaků, bez duplicit (bez ohledu na velikost písmen, po oříznutí mezer), žádná prázdná. Otázka je text quacku (max 280, jako dnes). |
| Hlasování                | Jeden hlas na osobu a anketu, vynucený databází. Hlasovat může každý přihlášený, i autor.                                                                        |
| Změna hlasu              | Povolena: vybereš jinou odpověď a hlas se přesune. Stáhnout hlas bez nové volby nejde. Kliknutí na aktuální odpověď nic neudělá.                                 |
| Viditelnost              | Počty a procenta jsou vidět vždy, i před hlasováním. Hlasy jsou anonymní: nikdo nevidí, kdo pro co hlasoval. Svou odpověď vidíš označenou.                       |
| Úpravy, mazání, uzavření | Žádné. Anketu nelze po vytvoření upravit, smazat ani uzavřít. Nemazání zároveň chrání už odevzdané hlasy. (Lze doplnit později, pokud to lidé budou používat.)   |
| Pocit z použití          | Hlas se projeví okamžitě (optimisticky). Pokud požadavek selže, hlas se vrátí zpět a je vidět chybová zpráva.                                                    |
| Aktuálnost               | Počty se znovu načtou při návratu na záložku a po každém hlasu. Žádný polling, žádné websockety.                                                                 |
| Vyhledávání              | Stávající vyhledávání quacků funguje dál. Hledá v textu otázky (text quacku) a jménu autora. V odpovědích se nehledá.                                            |
| Jazyk                    | Veškerý text v UI je anglicky, sentence case. Tyto dokumenty (story, plan) jsou česky.                                                                           |

## Akceptace (ze zadání)

- Dva účty v produkci: jeden se zeptá, druhý hlasuje, první po obnovení stránky vidí jeho hlas.
- Změna hlasu změní počty pro všechny.
- Formuláře splňují kontroly z DESIGN.md.

## Mimo rozsah

Výběr více odpovědí, stažení hlasu, úprava/smazání/uzavření, termíny, jména hlasujících, živé push aktualizace, ankety mimo quack feed.
