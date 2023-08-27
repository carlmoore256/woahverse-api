/*
  Warnings:

  - You are about to drop the column `questionId` on the `signup_response` table. All the data in the column will be lost.
  - Added the required column `signup_question_id` to the `signup_response` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "signup_response" DROP CONSTRAINT "signup_response_questionId_fkey";

-- AlterTable
ALTER TABLE "signup_response" DROP COLUMN "questionId",
ADD COLUMN     "signup_question_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "signup_response" ADD CONSTRAINT "signup_response_signup_question_id_fkey" FOREIGN KEY ("signup_question_id") REFERENCES "signup_question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
