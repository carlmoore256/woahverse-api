CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    title TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    chat_session_id TEXT,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    embedding vector(1536),
    role TEXT, -- human or ai
    FOREIGN KEY(chat_session_id) REFERENCES chat_sessions(id)
);


-- emotional state could be associated with user or global
CREATE TABLE IF NOT EXISTS emotional_state (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prompt TEXT, -- a reflection of the emotional state is the prompt, which expresses how it feels
    embedding vector(1536)
);

-- this emotion could even be represented differently for each user?
-- could be a way of the model combining emotions to create a new one
CREATE TABLE IF NOT EXISTS emotion (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    embedding vector(1536) -- make a summation of the text it gets into an embedding, so it's easy to pull out what an emotion is associated with
);

-- junction that associates emotions with emotional state
-- each emotional state will be comprised of some emotions 
CREATE TABLE IF NOT EXISTS emotional_state_emotion (
    emotional_state_id TEXT,
    emotion_id TEXT,
    PRIMARY KEY(emotional_state_id, emotion_id),
    FOREIGN KEY(emotional_state_id) REFERENCES emotional_state(id),
    FOREIGN KEY(emotion_id) REFERENCES emotion(id)
);

-- represents globally how woah is feeling
CREATE TABLE IF NOT EXISTS global_emotional_state (
    emotional_state_id TEXT PRIMARY KEY,
    FOREIGN KEY(emotional_state_id) REFERENCES emotional_state(id)
);


-- represents how woah feels about a particular user
CREATE TABLE IF NOT EXISTS user_emotional_state (
    emotional_state_id TEXT,
    user_id TEXT,
    PRIMARY KEY(emotional_state_id, user_id),
    FOREIGN KEY(emotional_state_id) REFERENCES emotional_state(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- represents how woah feels about a particular chat session
CREATE TABLE IF NOT EXISTS chat_session_emotional_state (
    emotional_state_id TEXT,
    chat_session_id TEXT,
    PRIMARY KEY(emotional_state_id, chat_session_id),
    FOREIGN KEY(emotional_state_id) REFERENCES emotional_state(id),
    FOREIGN KEY(chat_session_id) REFERENCES chat_sessions(id)
);

-- woah awards prizes to users for some given conditions, which are stored here
CREATE TABLE IF NOT EXISTS chat_prize (
    id TEXT PRIMARY KEY,
    chat_session_id TEXT,
    value INTEGER, -- number of points awarded
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(chat_session_id) REFERENCES chat_sessions(id)
);

-- a leaderboard of users and how close they are with woah
CREATE TABLE IF NOT EXISTS friend_leaderboard (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    score INTEGER, -- user gets points awarded during conversations
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- have a form that asks for users social when they sign up
CREATE TABLE IF NOT EXISTS user_social (
    user_id TEXT PRIMARY KEY,
    username TEXT,
    platform TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
);


-- exists to give a unique intro for a person
-- one-time thing
CREATE TABLE IF NOT EXISTS user_prompt (

);