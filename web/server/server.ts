import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth from "@shopify/koa-shopify-auth";
import Shopify, { ApiVersion } from "@shopify/shopify-api";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import mongoose from "mongoose";

// ------------ Shopthru Module Imports ------------
import { storeCallback, loadCallback, deleteCallback } from "./auth";
import { afterAuth, contentSecHeader } from "./middlewares";
import { nextApp as app } from "./controllers";
import { globaErrorHandler } from "./controllers";
import { webhookRoutes, nextRoutes } from "./routers";

// ------------ INITIATING APP  ------------
dotenv.config();
const port = process.env.PORT || 8000;
const uri = process.env.MONGODB_URL!;

mongoose
  .connect(uri)
  .then(() => console.log("> Database connection successful!"))
  .catch((err) => console.log(err));

// ------------ CUSTOM SESSION STORAGE ------------
const sessionStorage = new Shopify.Session.CustomSessionStorage(
  storeCallback,
  loadCallback,
  deleteCallback
);

// ------------ INITIALIZE SHOPIFY CONTEXT ------------
Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY!,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET!,
  SCOPES: process.env.SCOPES!.split(","),
  HOST_NAME: process.env.HOST!.replace(/https:\/\/|\/$/g, ""),
  API_VERSION: ApiVersion.October20,
  IS_EMBEDDED_APP: true,
  SESSION_STORAGE: sessionStorage,
});

// ------------ INITIATE SERVER ------------
app.prepare().then(async () => {
  const server = new Koa();
  const router = new Router();
  server.keys = [Shopify.Context.API_SECRET_KEY];
  // ------------ GLOBAL MIDDLEWARES ------------
  server.use(globaErrorHandler);
  server.use(contentSecHeader);
  server.use(bodyParser({}));
  server.use(
    createShopifyAuth({
      accessMode: "offline",
      afterAuth,
    })
  );

  // ------------ CUSTOM (API) ROUTES ------------
  server.use(webhookRoutes());

  // ------------ NEXT (MERCHANT UI) ROUTES ------------
  server.use(nextRoutes());
  // ------------ OTHER ROUTER MIDDLEWARES ------------
  server.use(router.allowedMethods());
  server.use(router.routes());

  // ------------ START SERVER ------------
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
