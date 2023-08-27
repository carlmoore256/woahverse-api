/*
  Warnings:

  - Added the required column `templateId` to the `SignupQuestion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SignupQuestion" ADD COLUMN     "templateId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "SignupQuestion" ADD CONSTRAINT "SignupQuestion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "QuestionTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
