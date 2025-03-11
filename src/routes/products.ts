import { Hono } from "hono";
import { sql } from "bun";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";

// Schemas
const createProductSchema = z.object({
    title: z.string().max(50),
    description: z.string().max(500).optional(),
    image: z.string().url().max(255).optional(),
    price: z.number(),
});

// Routing
export const productsRoute = new Hono();

productsRoute.get("/", async (c) => {
    return c.json(await sql`SELECT * FROM "products"`);
});

productsRoute.post("/", zValidator("json", createProductSchema), async (c) => {
    await sql`INSERT INTO "products" ${sql(c.req.valid("json"))}`;
});

productsRoute.get("/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    if (Number.isNaN(id)) {
        throw new HTTPException(400, { message: "ID is not a valid number" });
    }
    return c.json(await sql`SELECT * FROM "products" WHERE id = ${id}`);
});