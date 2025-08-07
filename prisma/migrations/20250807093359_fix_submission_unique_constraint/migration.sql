/*
  Warnings:

  - A unique constraint covering the columns `[userId,assignmentId]` on the table `submissions` will be added. If there are existing duplicate values, this will fail.
  - Made the column `assignmentId` on table `submissions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."submissions" DROP CONSTRAINT "submissions_assignmentId_fkey";

-- DropIndex
DROP INDEX "public"."submissions_userId_moduleId_key";

-- AlterTable
ALTER TABLE "public"."submissions" ALTER COLUMN "assignmentId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "submissions_userId_assignmentId_key" ON "public"."submissions"("userId", "assignmentId");

-- AddForeignKey
ALTER TABLE "public"."submissions" ADD CONSTRAINT "submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
