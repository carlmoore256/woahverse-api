/*
  Warnings:

  - You are about to drop the column `importance` on the `QuestionTemplate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "QuestionTemplate" DROP COLUMN "importance",
ADD COLUMN     "weight" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- DropEnum
DROP TYPE "QuestionTemplateImportance";
