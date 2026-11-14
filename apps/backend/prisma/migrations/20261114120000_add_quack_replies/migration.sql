-- AlterTable
ALTER TABLE "quack" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "parentId" TEXT,
ALTER COLUMN "text" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "quack_parentId_idx" ON "quack"("parentId");

-- AddForeignKey
ALTER TABLE "quack" ADD CONSTRAINT "quack_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "quack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A tombstone has no content (docs/adr/0001).
ALTER TABLE "quack" ADD CONSTRAINT "quack_tombstone_has_no_content" CHECK ("deletedAt" IS NULL OR ("text" IS NULL AND "mood" IS NULL));
