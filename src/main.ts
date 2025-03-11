import { Hono } from "hono";
import { productsRoute } from "./routes/products";

const app = new Hono().basePath("api");

app.route("/products", productsRoute);

export default app;