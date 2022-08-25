import { Context } from "koa";
import crypto from "crypto";
import axios from "axios";

import { WebhookDb } from "../../database";
import { VERSION } from "../../constants";

export const getShopifyClient = (shop: string, token: string) =>
  axios.create({
    baseURL: `https://${shop}/admin/api/${VERSION}`,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
  });

export const saveWebhook = async (data) => {
  try {
    await WebhookDb.create(data);
    return "Webhook successfully registered";
  } catch (error) {
    throw error;
  }
};

export const handleShopifyGQLError = (error) => {
  const message = error
    .map((err, i) => `message ${i + 1}: ${err.message}`)
    .join(", ");
  throw new Error(message);
};

export const validateNextRequest = (ctx: Context) => {
  let queryStr = ctx.request.header.referer?.split("?")[1];
  if (!queryStr) queryStr = ctx.querystring;

  const queryArr = queryStr?.split("&");
  const shop = queryArr.find((s) => s.includes("shop"))?.split("=")[1];
  const hmac = queryArr.find((h) => h.includes("hmac"))?.split("=")[1];
  if (!hmac || !shop)
    return {
      authorized: false,
      shop: "",
    };
  const message = queryArr.filter((item) => !item.includes("hmac")).join("&");
  const digest = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET!)
    .update(message)
    .digest("hex");
  return {
    shop,
    authorized: crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac)),
  };
};

export const validateWebhookRequest = (hmac, body) => {
  const digest = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET!)
    // @ts-ignore
    .update(body, "utf-8")
    .digest("base64");
  return digest === hmac;
};

export const validateSession = (
  session: {
    iss: string;
    dest: string;
    aud: string;
    sub: string;
    exp: number;
    nbf: number;
    iat: number;
    jti: string;
    sid: string;
  },
  jwt: string
) => {
  const issuer = session.iss.replace("https://", "").split("/")[0];
  const shop = session.dest.replace("https://", "");
  let components = jwt.split(".");
  const message = `${components[0]}.${components[1]}`;
  const signature = components[2];
  const digest = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET!)
    .update(message)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  if (new Date(session.exp * 1000).getTime() < new Date().getTime())
    return false;
  if (new Date(session.nbf * 1000).getTime() > new Date().getTime())
    return false;
  if (issuer !== shop) return false;
  if (session.aud !== process.env.SHOPIFY_API_KEY!) return false;
  return digest === signature;
};
