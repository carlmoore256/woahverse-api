-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "chat_prize" (
    "id" TEXT NOT NULL,
    "chat_session_id" TEXT,
    "value" INTEGER,
    "reason" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_prize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_session_emotional_state" (
    "emotional_state_id" TEXT NOT NULL,
    "chat_session_id" TEXT NOT NULL,

    CONSTRAINT "chat_session_emotional_state_pkey" PRIMARY KEY ("emotional_state_id","chat_session_id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emotion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "embedding" vector(1536),

    CONSTRAINT "emotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emotional_state" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "prompt" TEXT,
    "embedding" vector(1536),

    CONSTRAINT "emotional_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emotional_state_emotion" (
    "emotional_state_id" TEXT NOT NULL,
    "emotion_id" TEXT NOT NULL,

    CONSTRAINT "emotional_state_emotion_pkey" PRIMARY KEY ("emotional_state_id","emotion_id")
);

-- CreateTable
CREATE TABLE "friend_leaderboard" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "score" INTEGER,

    CONSTRAINT "friend_leaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_emotional_state" (
    "emotional_state_id" TEXT NOT NULL,

    CONSTRAINT "global_emotional_state_pkey" PRIMARY KEY ("emotional_state_id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "chat_session_id" TEXT,
    "message" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "embedding" vector(1536),
    "role" TEXT,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_emotional_state" (
    "emotional_state_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "user_emotional_state_pkey" PRIMARY KEY ("emotional_state_id","user_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "chat_prize" ADD CONSTRAINT "chat_prize_chat_session_id_fkey" FOREIGN KEY ("chat_session_id") REFERENCES "chat_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_session_emotional_state" ADD CONSTRAINT "chat_session_emotional_state_chat_session_id_fkey" FOREIGN KEY ("chat_session_id") REFERENCES "chat_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_session_emotional_state" ADD CONSTRAINT "chat_session_emotional_state_emotional_state_id_fkey" FOREIGN KEY ("emotional_state_id") REFERENCES "emotional_state"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "emotional_state_emotion" ADD CONSTRAINT "emotional_state_emotion_emotion_id_fkey" FOREIGN KEY ("emotion_id") REFERENCES "emotion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "emotional_state_emotion" ADD CONSTRAINT "emotional_state_emotion_emotional_state_id_fkey" FOREIGN KEY ("emotional_state_id") REFERENCES "emotional_state"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "friend_leaderboard" ADD CONSTRAINT "friend_leaderboard_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "global_emotional_state" ADD CONSTRAINT "global_emotional_state_emotional_state_id_fkey" FOREIGN KEY ("emotional_state_id") REFERENCES "emotional_state"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_session_id_fkey" FOREIGN KEY ("chat_session_id") REFERENCES "chat_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_emotional_state" ADD CONSTRAINT "user_emotional_state_emotional_state_id_fkey" FOREIGN KEY ("emotional_state_id") REFERENCES "emotional_state"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_emotional_state" ADD CONSTRAINT "user_emotional_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
