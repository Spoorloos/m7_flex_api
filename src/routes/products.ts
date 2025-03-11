import { Hono } from "hono";
import { sql } from "bun";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

// Schemas
const getProductsSchema = z.object({
    filter: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    order: z.enum(["asc", "desc"]).optional(),
    limit: z.coerce.number().optional(),
});

const createProductSchema = z.object({
    title: z.string().max(50),
    description: z.string().max(500).optional(),
    image: z.string().url().max(255).optional(),
    price: z.number(),
});

const getProductSchema = z.object({
    id: z.coerce.number().int().min(0),
});

// Routing
const productsRoute = new Hono();

productsRoute.get("/", zValidator("query", getProductsSchema), async (c) => {
    const { filter, minPrice, maxPrice, order, limit } = c.req.valid("query");

    return c.json(await sql`
        SELECT * FROM "products" WHERE 1=1
        ${filter !== undefined ? sql`AND "title" ILIKE ${`%${filter}%`}` : sql``}
        ${minPrice !== undefined ? sql`AND "price" >= ${minPrice}` : sql``}
        ${maxPrice !== undefined ? sql`AND "price" <= ${maxPrice}` : sql``}
        ${order !== undefined ? sql`ORDER BY "date_added" ${order === "asc" ? sql`ASC` : sql`DESC`}` : sql``}
        ${limit !== undefined ? sql`LIMIT ${limit}` : sql``}
    `);
});

productsRoute.post("/", zValidator("json", createProductSchema), async (c) => {
    await sql`INSERT INTO "products" ${sql(c.req.valid("json"))}`;
});

productsRoute.get("/:id", zValidator("param", getProductSchema), async (c) => {
    return c.json((await sql`SELECT * FROM "products" WHERE "id" = ${c.req.valid("param").id}`)[0]);
});

export default productsRoute;