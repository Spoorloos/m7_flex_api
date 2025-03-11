import { Hono } from "hono";
import productsRoute from "./routes/products";

const apiRoute = new Hono().basePath("api");

apiRoute.route("/products", productsRoute);

export default apiRoute;