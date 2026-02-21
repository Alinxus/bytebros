import { Hono } from "hono";
import { prisma } from "./db/prisma.js";
import { randomBytes, createHash } from "crypto";

const auth = new Hono();

auth.post("/signup", async (c) => {
  const body = await c.req.json<{
    email: string;
    password: string;
    name?: string;
  }>();

  if (!body.email || !body.password) {
    return c.json({ error: "email and password required" }, 400);
  }

  if (body.password.length < 8) {
    return c.json({ error: "password must be at least 8 characters" }, 400);
  }

  const userId = `user_${randomBytes(8).toString("hex")}`;
  const salt = randomBytes(16).toString("hex");
  const passwordHash = createHash("sha256").update(salt + body.password).digest("hex");

  const apiKey = `ck_${randomBytes(24).toString("hex")}`;
  const keyHash = createHash("sha256").update(apiKey).digest("hex");

  const user = await prisma.user.create({
    data: {
      id: userId,
      email: body.email,
      name: body.name,
      passwordHash: `${salt}:${passwordHash}`,
      apiKeys: {
        create: {
          keyId: userId,
          keyHash,
          keyPrefix: apiKey.slice(0, 8),
          name: "Primary API Key",
          scopes: ["read", "write"],
          isActive: true,
        },
      },
    },
  });

  return c.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name },
    apiKey,
  }, 201);
});

auth.post("/login", async (c) => {
  const body = await c.req.json<{ email: string; password: string }>();

  if (!body.email || !body.password) {
    return c.json({ error: "email and password required" }, 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: body.email },
  });

  if (!user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const [salt, hash] = user.passwordHash.split(":");
  const inputHash = createHash("sha256").update(salt + body.password).digest("hex");

  if (inputHash !== hash) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const apiKey = `ck_${randomBytes(24).toString("hex")}`;
  const keyHash = createHash("sha256").update(apiKey).digest("hex");
  const keyId = `key_${randomBytes(8).toString("hex")}`;
  const keyPrefix = `ck_${randomBytes(4).toString("hex")}`;

  await prisma.apiKey.create({
    data: {
      userId: user.id,
      keyId,
      keyHash,
      keyPrefix,
      name: "Session API Key",
      scopes: ["read", "write"],
      isActive: true,
    },
  });

  return c.json({
    success: true,
    user: { id: user.id, email: user.email },
    apiKey,
  });
});

export default auth;
