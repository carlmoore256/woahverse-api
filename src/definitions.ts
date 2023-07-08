import dotenv from 'dotenv';
dotenv.config();

export const VECTOR_STORE_ROOT = process.env.VECTOR_STORE_ROOT as string;
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const DB_ROOT = process.env.DB_ROOT as string;

export const REPOCHAT_API_URL = process.env.API_URL as string;
export const REPOCHAT_PORT = 3001;
export const REPOCHAT_API_VERSION = '/v1';
export const REPOCHAT_DB_FILE = `${DB_ROOT}/repochat.db`;
