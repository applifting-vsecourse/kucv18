# Odpovědi na quacky

## User story

Jako uživatel chci odpovědět přímo na konkrétní quack a vidět odpovědi pod ním, abych věděl, kdo na co reaguje. Když autor svůj quack smaže, odpovědi na něj zůstanou, ale jeho obsah z aplikace zmizí.

## Kontext

Lidé dnes diskutují tak, že napíšou nový quack začínající „@jméno…“, a nikdo pak neví, kdo na co reaguje. Odpovědi patří lidem, kteří je napsali, takže se smazáním rodiče nesmí ztratit. Zároveň platí, že smazaný quack musí opravdu zmizet: jeho text, nálada a anketa nesmí být vidět ve feedu, v odpovědích ani ve vyhledávání.

## Akceptační kritéria

Odpovídání

- Přihlášený uživatel může odpovědět na quack. Odpověď má text a volitelnou náladu, anketu mít nemůže (400).
- Na odpověď se odpovědět nedá (400). Vlákno má jedinou úroveň.
- Na smazaný quack (tombstone) se odpovědět nedá (409). Neexistující quack vrací 404.
- Autora odpovědi bere server ze session, ne z těla požadavku.

Zobrazení

- Feed (All i Mine) ukazuje jen quacky nejvyšší úrovně. Odpovědi tam samostatně nejsou.
- Karta ve feedu ukazuje „N replies“.
- Klik na quack otevře stránku vlákna `/quacks/$id`: quack (nebo tombstone), pod ním odpovědi od nejstarší a formulář pro odpověď.
- Vyhledávání najde i text odpovědi. Výsledek odkazuje na vlákno.

Mazání

- Quack bez odpovědí se smaže doopravdy (`DELETE` řádku).
- Quack s odpověďmi se změní na tombstone: `text` a `mood` se vymažou, anketa se smaže včetně hlasů, nastaví se `deletedAt`.
- Tombstone zůstává ve feedu na svém místě s odpověďmi pod sebou a textem „This quack was deleted“. API nevrací autora ani datum. V záložce Mine se nezobrazuje.
- Opakované smazání tombstonu vrací 404.
- Smazání odpovědi je vždy skutečné smazání. Pokud tím zmizí poslední odpověď tombstonu, smaže se ve stejné transakci i tombstone.
- Smazat quack nebo odpověď smí autor nebo admin, kontrola zůstává na jednom místě ve službě (`isOwner || isAdmin`).
- Smazaný text se nesmí objevit nikde: ve feedu, v odpovědích ani ve vyhledávání (včetně hledání podle jména autora tombstonu).

## Rozhodnutí z upřesňování

1. **Co znamená „smazáno“, když quack má odpovědi: tombstone, jinak skutečné smazání.**
   Zamítnuto: (A) skutečné smazání a odpovědi se stanou quacky nejvyšší úrovně, protože odpovědi ztratí kontext a vrátíme se k původnímu problému. (B) skutečné smazání s volným odkazem bez cizího klíče, protože se tím vzdáme referenční integrity. Zamítnuto také: tombstone vždy, i bez odpovědí, protože by hromadil prázdné řádky.
2. **Odpověď je `Quack` s `parentId` (self-relation).**
   Zamítnuto: samostatná tabulka `Reply`, protože by se zdvojilo mazání, oprávnění, tombstone i hledání a odpověď na odpověď by později vyžadovala migraci. Zamítnuto: tabulka `Thread`, protože je to nadbytečné.
3. **Hloubka: jedna úroveň, kontrola ve službě.**
   Zamítnuto: plochá hloubka v UI s libovolnou hloubkou v datech a neomezené vnořování, protože obojí vyžaduje rekurzivní dotaz a pro zadání je to zbytečné. Pozdější povolení vnoření nepotřebuje migraci.
4. **Odpovědi jsou jen ve vlákně a počet se počítá při čtení.**
   Zamítnuto: odpovědi i ve feedu (hluk, blízko původnímu „@jméno“). Zamítnuto: uložený sloupec `replyCount`, protože je to druhá kopie dat, kterou je nutné udržovat při každé odpovědi a smazání, a nemáme důvod, proč ji potřebovat.
5. **Tombstone nic nevystavuje.** `text` a `mood` se vymažou, anketa se smaže, API nevrací autora ani datum. `userId` zůstává v řádku kvůli cizímu klíči.
   Zamítnuto: zobrazit autora a datum (proti „opravdu zmizet“). Zamítnuto: anonymní tombstone s nullable `userId`, protože oslabuje omezení pro všechny quacky a komplikuje kaskádu při smazání uživatele.
6. **Tombstone zůstává ve feedu a je uzavřený pro nové odpovědi (409). V Mine se nezobrazuje.**
   Zamítnuto: otevřený tombstone, protože vlákno by dál rostlo pod obsahem, který autor odstranil. Skrytí tombstonu z feedu by znepřístupnilo jeho odpovědi.
7. **Prázdný tombstone se maže ve stejné transakci jako poslední odpověď.**
   Zamítnuto: nechat ho ležet (porušuje pravidlo „tombstone existuje jen s odpověďmi“) a pravidelný úklid (potřebuje plánovač a vytváří okno s mrtvými řádky).
8. **`parentId` má `onDelete: Restrict`.** Databáze odmítne smazat quack, který má odpovědi.
   Zamítnuto: `SetNull` (odpovědi by tiše osiřely) a `Cascade` (odporuje zadání). Důsledek: smazání uživatele, jehož quacky mají cizí odpovědi, selže, dokud se to nevyřeší. Smazání účtu zatím není funkce aplikace a dostane vlastní rozhodnutí.
9. **Odpověď má text a volitelnou náladu, anketu ne.** Omezení je pravidlo služby, ne schématu, takže se dá později uvolnit bez migrace.
10. **Čtení: stránka vlákna `/quacks/$id`.**
    Zamítnuto: rozbalení přímo ve feedu (druhý požadavek na kartu, bez sdílitelného odkazu) a odpovědi vždy ve feedu (payload roste s každou odpovědí).

## Mimo rozsah

- Odpověď na odpověď (vnořování), uložený čítač odpovědí, odpovědi s anketou.
- Mazání uživatelských účtů a co se pak stane s jejich quacky.
- Okamžité zmizení smazaného quacku ostatním divákům (uvidí změnu při příštím načtení).

## Navržené schéma

```prisma
model Quack {
  id        String    @id @default(cuid())
  // null on a tombstone: the content is really gone
  text      String?   @db.Text
  mood      Mood?
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  // set on a reply; Restrict: a quack that has replies can never be hard-deleted
  parent    Quack?    @relation("QuackReplies", fields: [parentId], references: [id], onDelete: Restrict)
  parentId  String?
  replies   Quack[]   @relation("QuackReplies")
  // set only on a top-level quack that has replies (a tombstone)
  deletedAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @default(now()) @updatedAt

  poll      Poll?

  @@index([userId])
  @@index([parentId])
  @@map("quack")
}
```

Migrace přidá nullable `parentId` a `deletedAt`, uvolní `NOT NULL` na `text` a přidá index na `parentId`. Volitelně `CHECK ("deletedAt" IS NULL OR "text" IS NULL)`, aby databáze nepustila tombstone s textem.

## Kontrola proti třem otázkám

**1. Dá se všechno, co uživatel vidí, přečíst jednoduchými dotazy?**

- Feed: `quack WHERE parentId IS NULL`, s `_count: { replies }`, od nejnovějších.
- Mine: `parentId IS NULL AND deletedAt IS NULL AND userId = :me`.
- Vlákno: `quack WHERE id = :id` včetně `replies ORDER BY createdAt ASC`.
- Hledání: shoda v textu quacků nejvyšší úrovně a odpovědí, které nejsou `deletedAt`. Tombstony se přeskakují i při hledání podle jména autora. Výsledek odpovědi odkazuje na rodiče.

**2. Je něco uloženo dvakrát?** Ne. Počet odpovědí se počítá při čtení (`_count`), autor se čte přes `userId`. Rozhodnutí o uloženém `replyCount` je zamítnuto (viz bod 4).

**3. Co se stane se souvisejícími řádky při smazání quacku?**

- Bez odpovědí: řádek zmizí a anketa s hlasy odejde kaskádou.
- S odpovědmi: řádek zůstane jako tombstone (text a mood vymazány, anketa smazána) a odpovědi zůstanou.
- Smazání poslední odpovědi tombstonu smaže i tombstone.
- Databáze nikdy nesmaže rodiče, který má odpovědi (`Restrict`).

**4. Poběží migrace na produkční databázi s daty?** Ano. Přidává se jen nullable `parentId` a `deletedAt`, `text` přestává být povinný a přidává se index. Existující řádky zůstanou beze změny jako quacky nejvyšší úrovně bez `deletedAt`. Nic se nepřepisuje a nic se neztrácí.
