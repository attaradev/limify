import Router from "koa-router";
import combineRouters from "koa-combine-routers";
import {
  handleRequest,
  generalNextController,
} from "../../controllers";
const router = new Router();

router
  .get("(/_next/static/.*)", handleRequest) // Static content is clear
  .get("/_next/webpack-hmr", handleRequest) // Webpack content is clear
  .get("(.*)", generalNextController); // Handle all other routes

const routes = combineRouters(router);
export default routes;
