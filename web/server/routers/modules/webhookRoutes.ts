import Router from "koa-router";
import combineRouters from "koa-combine-routers";
import { webhookController } from "../../controllers";
import { authenticateWebhook } from "../../middlewares";

const router = new Router({ prefix: "/webhooks" });

router.post("/:category/:sub", authenticateWebhook, webhookController);

const routes = combineRouters(router);
export default routes;
