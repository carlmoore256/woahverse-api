/*
  Warnings:

  - You are about to drop the column `session_id` on the `signup_response` table. All the data in the column will be lost.
  - Added the required column `signup_session_id` to the `signup_question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signup_session_id` to the `signup_response` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "signup_response" DROP CONSTRAINT "signup_response_session_id_fkey";

-- AlterTable
ALTER TABLE "signup_question" ADD COLUMN     "signup_session_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "signup_response" DROP COLUMN "session_id",
ADD COLUMN     "signup_session_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "signup_question" ADD CONSTRAINT "signup_question_signup_session_id_fkey" FOREIGN KEY ("signup_session_id") REFERENCES "signup_session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signup_response" ADD CONSTRAINT "signup_response_signup_session_id_fkey" FOREIGN KEY ("signup_session_id") REFERENCES "signup_session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
