import { Hono } from "hono";
import { sql } from "bun";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";

// Schemas
const querySchema = z.object({
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

// Routing
const productsRoute = new Hono({ strict: false });

productsRoute.get("/", zValidator("query", querySchema), async (c) => {
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

productsRoute.get("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    if (!Number.isInteger(id) || id < 0) {
        throw new HTTPException(400, { message: "ID is negative or not an integer" });
    }
    return c.json((await sql`SELECT * FROM "products" WHERE id = ${id}`)[0]);
});

export default productsRoute;