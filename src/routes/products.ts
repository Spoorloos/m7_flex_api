import { Hono } from "hono";
import { sql } from "bun";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

// Schemas
const productsQuerySchema = z.object({
    filter: z.string().optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
    order: z.enum(["asc", "desc"]).optional(),
    limit: z.coerce.number().int().nonnegative().optional(),
});

const newProductSchema = z.object({
    title: z.string().max(50),
    description: z.string().max(500).optional(),
    image: z.string().url().max(255).optional(),
    price: z.number().nonnegative(),
});

const productIdSchema = z.object({
    id: z.coerce.number().int().nonnegative(),
});

// Routing
const productsRoute = new Hono();

productsRoute.get("/", zValidator("query", productsQuerySchema), async (c) => {
    const { filter, minPrice, maxPrice, order, limit } = c.req.valid("query");

    return c.json(await sql`
        SELECT * FROM "products" WHERE 1=1
        ${filter !== undefined ? sql`AND "title" ILIKE ${`%${filter}%`}` : sql``}
        ${minPrice !== undefined ? sql`AND "price" >= ${minPrice}` : sql``}
        ${maxPrice !== undefined ? sql`AND "price" <= ${maxPrice}` : sql``}
        ${order !== undefined ? sql`ORDER BY "date_added" ${sql.unsafe(order)}` : sql``}
        ${limit !== undefined ? sql`LIMIT ${limit}` : sql``}
    `);
});

productsRoute.post("/", zValidator("json", newProductSchema), async (c) => {
    const data = c.req.valid("json");
    await sql`INSERT INTO "products" ${sql(data)}`;
    return c.body(null, 201);
});

productsRoute.get("/:id", zValidator("param", productIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    return c.json(await sql`SELECT * FROM "products" WHERE "id" = ${id}`);
});

productsRoute.delete("/:id", zValidator("param", productIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    await sql`DELETE FROM "products" WHERE "id" = ${id}`;
    return c.body(null, 204);
});

productsRoute.put("/:id",
    zValidator("param", productIdSchema),
    zValidator("json", newProductSchema.partial()),
    async (c) => {
        const { id } = c.req.valid("param");
        const data = c.req.valid("json");

        await sql`UPDATE "products" SET ${sql(data)} WHERE "id" = ${id}`;
        return c.body(null, 204);
    }
);

export default productsRoute;