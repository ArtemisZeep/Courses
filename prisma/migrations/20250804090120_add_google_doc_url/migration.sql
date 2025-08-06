/*
  Warnings:

  - You are about to drop the column `googleDocsUrl` on the `modules` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."lessons" ADD COLUMN     "googleDocUrl" TEXT,
ALTER COLUMN "contentHtml" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."modules" DROP COLUMN "googleDocsUrl";
