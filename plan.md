# Plán: ankety

Navazuje na [story.md](story.md). Kopíruje vzor quacků: model → repository → service → controller (validace přes DTO, uživatel ze session) → zod schéma → TanStack Query → UI.

## 1. Datový model

Dvě nové tabulky plus hlasy. Anketa je volitelné rozšíření quacku, ne samostatný typ obsahu.

```prisma
model Poll {
  id      String       @id @default(cuid())
  quack   Quack        @relation(fields: [quackId], references: [id], onDelete: Cascade)
  quackId String       @unique            // 1:1 — quack má nejvýš jednu anketu
  options PollOption[]
  votes   PollVote[]
  @@map("poll")
}

model PollOption {
  id       String     @id @default(cuid())
  poll     Poll       @relation(fields: [pollId], references: [id], onDelete: Cascade)
  pollId   String
  text     String     @db.VarChar(80)
  position Int                              // pořadí zobrazení, od 0
  votes    PollVote[]

  @@unique([pollId, position])
  @@unique([id, pollId])                    // cíl složeného cizího klíče níže
  @@map("poll_option")
}

model PollVote {
  id        String     @id @default(cuid())
  poll      Poll       @relation(fields: [pollId], references: [id], onDelete: Cascade)
  pollId    String
  option    PollOption @relation(fields: [optionId, pollId], references: [id, pollId], onDelete: Cascade)
  optionId  String
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  createdAt DateTime   @default(now())
  updatedAt DateTime   @default(now()) @updatedAt

  @@unique([pollId, userId])                // jedna osoba, jeden hlas — vynucuje DB
  @@index([optionId])
  @@map("poll_vote")
}
```

Relace přidané do stávajících modelů: `Quack.poll Poll?`, `User.pollVotes PollVote[]`.

Proč je to postavené takhle:

- **Jeden hlas na osobu:** `@@unique([pollId, userId])`. Dva souběžné požadavky nemohou oba vložit hlas.
- **Změna hlasu:** jediný upsert na `(pollId, userId)`, který nastaví `optionId`. Je atomický, takže člověk nikdy nemá uprostřed změny nula ani dva hlasy.
- **Odpověď musí patřit do dané ankety:** složený cizí klíč `(optionId, pollId) → (id, pollId)` zajistí, že DB odmítne hlas pro odpověď z jiné ankety. Service to kontroluje také, aby vrátil srozumitelné 400/404 místo chyby constraintu.
- **Žádné uložené čítače.** Počty se při čtení počítají přes `COUNT(*) GROUP BY optionId`. Není co rozjet, takže "čísla jsou správně pro všechny" platí z principu. Pro tento rozsah stačí.
- **Kaskády:** smazání uživatele smaže jeho hlasy (počty se upraví). Aplikace anketu nikdy nemaže, ale kaskáda quack → anketa drží DB konzistentní.
- Migrace: `pnpm backend prisma:migrations:run`. Složený cizí klíč a `ON DELETE` zkontrolovat ve vygenerovaném SQL, případně upravit ručně, pokud je Prisma nevygeneruje.

## 2. API

Vše za existujícím guardem na session. Zdokumentováno ve Swaggeru.

| Endpoint                      | Účel                                                                                                                                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /api/quacks`            | Rozšířen: volitelné `poll: { options: string[] }`. Validace: 2–6 položek, každá oříznutá, 1–80 znaků, unikátní bez ohledu na velikost písmen. Quack + anketa + odpovědi se vytvoří v jedné transakci.              |
| `GET /api/quacks`             | Každý quack dostane `poll: null` nebo `{ id, options: [{ id, text, votes }], totalVotes, myVoteOptionId }`. Počty vznikají jedním seskupeným dotazem pro všechny vrácené ankety (bez N+1).                         |
| `PUT /api/polls/:pollId/vote` | Tělo `{ optionId }`. Upsert hlasu volajícího. Idempotentní: dvakrát stejná odpověď nic nezmění. 404 pro neznámou anketu, 400 pokud odpověď do ankety nepatří. Vrací aktualizovanou anketu (stejný tvar jako výše). |

`userId` vždy pochází ze session, nikdy z těla požadavku. Identity hlasujících se nikdy nevracejí.

Struktura backendu podle `modules/quack`: nový `modules/poll` (controller, service, repository, DTO, doménové typy) pro endpoint hlasování a počítání hlasů. Vytvoření a výpis quacků volají exportovaný service/repository, takže quack modul nezná detaily Prisma modelů ankety.

## 3. Frontend

Pod `features/quack` (anketa je součást quacku), nové soubory:

- `quackSchemas.ts`: zod `pollSchema` a `quackSchema.poll` (nullable).
- `api/voteInPoll.ts` a `hooks/useVote.ts`: TanStack mutace s optimistickým updatem. `onMutate`: zrušit a uložit snapshot list dotazů, lokálně přesunout hlas (−1 stará odpověď, +1 nová, nastavit `myVoteOptionId`). `onError`: obnovit snapshot a zobrazit chybu. `onSettled`: invalidovat `quackKeys.all()`, aby vyhrála čísla ze serveru.
- `components/QuackPoll.tsx`: uvnitř `QuackItem` seznam tlačítek s odpověďmi, počtem a procentem, tenký pruh podílu, moje odpověď označená. Žádné vnořené karty (DESIGN.md).
- `QuackForm.tsx`: přepínač "Add a poll" (shadcn switch/checkbox z kitu, přidaný přes `pnpm dlx shadcn@latest add`), 2 až 6 vstupů s viditelnými labely, tlačítka "Add answer" a "Remove" (ikonová s `aria-label`), klientská zod validace se zprávami pod poli, pending stav při odeslání. Server validuje znovu.
- **Neúspěšný hlas musí být vidět:** inline chyba pod anketou ("Your vote didn't go through. Try again."), která zůstane do dalšího pokusu nebo úspěšného hlasu. Ne jen toast.
- Refetch při focusu zajišťují stávající defaulty TanStack Query; ověřit, že nejsou vypnuté.
- Veškeré texty v UI anglicky, sentence case.

## 4. Pořadí implementace (jeden slice = jeden commit)

1. **Schéma + migrace**: tři modely, relace, migrace; v SQL ověřit unique a složený cizí klíč. Commit.
2. **Backend vytvoření**: validace DTO + transakční vytvoření ankety s quackem; unit testy validace (počet, délka, duplicity). Commit.
3. **Backend čtení**: počty a `myVoteOptionId` ve výpisu quacků (seskupený dotaz); testy. Commit.
4. **Backend hlasování**: `PUT /api/polls/:pollId/vote`, upsert, chybové případy; testy: první hlas, změna, dvakrát stejná odpověď, cizí odpověď, neznámá anketa, souběžný dvojitý hlas nechá jeden řádek. Commit.
5. **Frontend čtení**: zod schéma, zobrazení `QuackPoll` s počty a mým hlasem (jen čtení); testy stavů seznamu. Commit.
6. **Frontend hlasování**: mutace s optimistickým updatem, rollbackem a viditelnou chybou; testy úspěchu, změny a selhání s rollbackem. Commit.
7. **Frontend vytvoření**: pole ankety ve formuláři quacku; testy validace. Commit.
8. **Dokončení**: `pnpm check-all`, nové pravidlo v CLAUDE.md (nebo zdůvodnění, že se není co učit), merge do main, nasazení, kontrola se dvěma účty v produkci, příspěvek do Seminars.

Slice 2–4 jdou před jakýmkoli UI, aby se API dalo nejdřív ověřit ve Swaggeru. Podle CLAUDE.md dev servery už běží, takže žádné `pnpm dev` a žádný prohlížeč, pokud o něj nepožádáš: důkazem jsou testy a type-checky.

## 5. Rizika a kontroly před kódováním

- **Složený cizí klíč v Prisma:** vyžaduje navíc `@@unique([id, pollId])` na `PollOption`. Ověřit, že vygenerované SQL je platné.
- **Souběh optimistického updatu a refetche:** v `onMutate` zrušit probíhající list dotazy, jinak starší odpověď přepíše hlas.
- **Vyhledávací filtr** běží v service po načtení. Počty se načtou buď jen pro vyfiltrovaný výsledek, nebo pro všechno (jednodušší) a pak se filtruje. Rozhodnout ve slice 3 podle jednoduchosti.
- **Existující quacky** mají `poll: null`, datová migrace není potřeba.
