/*
  Warnings:

  - You are about to drop the `QuestionTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SignupQuestion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SignupResponse` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SignupSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "question_template_type" AS ENUM ('TEXT', 'MULTIPLE_CHOICE');

-- CreateEnum
CREATE TYPE "question_template_scenario" AS ENUM ('SIGNUP', 'CHAT');

-- DropForeignKey
ALTER TABLE "SignupQuestion" DROP CONSTRAINT "SignupQuestion_templateId_fkey";

-- DropForeignKey
ALTER TABLE "SignupResponse" DROP CONSTRAINT "SignupResponse_questionId_fkey";

-- DropForeignKey
ALTER TABLE "SignupResponse" DROP CONSTRAINT "SignupResponse_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "SignupSession" DROP CONSTRAINT "SignupSession_userId_fkey";

-- DropTable
DROP TABLE "QuestionTemplate";

-- DropTable
DROP TABLE "SignupQuestion";

-- DropTable
DROP TABLE "SignupResponse";

-- DropTable
DROP TABLE "SignupSession";

-- DropEnum
DROP TYPE "QuestionTemplateScenario";

-- DropEnum
DROP TYPE "QuestionTemplateType";

-- CreateTable
CREATE TABLE "signup_session" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "user_id" TEXT,

    CONSTRAINT "signup_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signup_question" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,

    CONSTRAINT "signup_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signup_response" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "session_id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "signup_response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_template" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "type" "question_template_type" NOT NULL,
    "scenario" "question_template_scenario" NOT NULL,

    CONSTRAINT "question_template_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "signup_session" ADD CONSTRAINT "signup_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signup_question" ADD CONSTRAINT "signup_question_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "question_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signup_response" ADD CONSTRAINT "signup_response_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "signup_session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signup_response" ADD CONSTRAINT "signup_response_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "signup_question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
