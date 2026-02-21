
import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { connectDatabase, prisma } from "../src/db/prisma.js";

const app = new Hono();

app.use("*", cors());

app.get("/", (c) => {
  return c.text('Hello world')
});
