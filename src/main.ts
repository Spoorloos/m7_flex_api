import { sql } from "bun";
import { Hono } from "hono";

const app = new Hono().basePath("api");

app.get("/products", async (c) => {
    const products = await sql`SELECT * FROM products`.values();
    return c.json(products);
})

export default app;