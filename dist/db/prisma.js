import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
const connectionString = process.env.DATABASE_URL || "";
let pool;
let adapter;
async function initPrisma() {
    pool = new Pool({
        connectionString,
        max: 1,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 10000,
    });
    adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}
export const prisma = await initPrisma();
export async function connectDatabase() {
    try {
        await prisma.$connect();
        console.log("[DB] Connected to PostgreSQL database");
    }
    catch (error) {
        console.error("[DB] Failed to connect:", error);
        throw error;
    }
}
export async function disconnectDatabase() {
    await prisma.$disconnect();
    if (pool) {
        await pool.end();
    }
    console.log("[DB] Disconnected");
}
