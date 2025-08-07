/*
  Warnings:

  - A unique constraint covering the columns `[userId,moduleId]` on the table `submissions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."submissions" DROP CONSTRAINT "submissions_assignmentId_fkey";

-- DropIndex
DROP INDEX "public"."submissions_userId_assignmentId_key";

-- AlterTable
ALTER TABLE "public"."submissions" ALTER COLUMN "assignmentId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "submissions_userId_moduleId_key" ON "public"."submissions"("userId", "moduleId");

-- AddForeignKey
ALTER TABLE "public"."submissions" ADD CONSTRAINT "submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
