-- CreateEnum
CREATE TYPE "QuestionTemplateImportance" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "QuestionTemplateType" AS ENUM ('TEXT', 'MULTIPLE_CHOICE');

-- CreateEnum
CREATE TYPE "QuestionTemplateScenario" AS ENUM ('SIGNUP', 'CHAT');

-- CreateTable
CREATE TABLE "SignupSession" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "userId" TEXT,

    CONSTRAINT "SignupSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignupQuestion" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "SignupQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignupResponse" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "SignupResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionTemplate" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "importance" "QuestionTemplateImportance" NOT NULL,
    "type" "QuestionTemplateType" NOT NULL,
    "scenario" "QuestionTemplateScenario" NOT NULL,

    CONSTRAINT "QuestionTemplate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SignupSession" ADD CONSTRAINT "SignupSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignupResponse" ADD CONSTRAINT "SignupResponse_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SignupSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignupResponse" ADD CONSTRAINT "SignupResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SignupQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
