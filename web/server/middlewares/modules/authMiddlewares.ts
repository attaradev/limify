import { Context, Next } from "koa";
import helmet from "koa-helmet";
import jwt from "jsonwebtoken";
import { createUser } from "../../auth";
import { MerchantInformation } from "../../auth";
import { Webhook } from "../../app";
import { validateWebhookRequest, AppError, validateSession } from "../../utils";

export const contentSecHeader = (ctx: Context, next: Next) => {
  // Cookie is set after auth
  if (ctx.cookies.get("shopOrigin")) {
    return helmet.contentSecurityPolicy({
      directives: {
        // @ts-ignore
        defaultSrc: helmet.contentSecurityPolicy.dangerouslyDisableDefaultSrc,
        frameAncestors: [
          `https://${ctx.cookies.get("shopOrigin")}`,
          "https://admin.shopify.com",
        ],
      },
    })(ctx, next);
  } else {
    // Before auth => no cookie set...
    return helmet.contentSecurityPolicy({
      directives: {
        // @ts-ignore
        defaultSrc: helmet.contentSecurityPolicy.dangerouslyDisableDefaultSrc,
        frameAncestors: [
          `https://${ctx.query.shop}`,
          "https://admin.shopify.com",
        ],
      },
    })(ctx, next);
  }
};

export const afterAuth = async (ctx: Context) => {
  // Access token and shop available in ctx.state.shopify
  const { shop, accessToken, scope } = ctx.state.shopify;
  const token = accessToken;
  const merchantInfo = new MerchantInformation(shop, token);
  const userinfo = await merchantInfo.fetch();
  //  creates a user after installation
  await createUser(shop, scope, userinfo.name, userinfo);

  // register app/uninstalled webhook
  const webhook = new Webhook(shop, token);
  await webhook.register(
    process.env.HOST!,
    "apps/uninstalled",
    "APP_UNINSTALLED"
  );

  // Redirect to app with shop parameter upon auth
  ctx.redirect(`https://${shop}/admin/apps/your-awesome-shopify-app-name`);
};

export const authenticateWebhook = async (ctx: Context, next: Next) => {
  const { body } = ctx.request;
  const { rawBody } = ctx.request;
  const shop = ctx.headers["x-shopify-shop-domain"];
  const topic = ctx.headers["x-shopify-topic"];
  const id = ctx.headers["x-shopify-webhook-id"];
  const hmac = ctx.headers["x-shopify-hmac-sha256"];
  const auth = validateWebhookRequest(hmac, rawBody);
  if (!auth) throw new AppError("Unauthorized app usage.", 401);

  ctx.state = { shop, topic, id, payload: body };
  return next();
};

export const authenticate = async (ctx: Context, next: Next) => {
  const token = ctx.request.headers.authorization?.split(" ")[1];
  if (!token) throw new AppError("Unauthorized app usage.", 401);
  const decoded: any = jwt.verify(token, process.env.SHOPIFY_API_SECRET!);
  const shop = decoded.dest.replace("https://", "");
  if (!validateSession(decoded, token))
    throw new AppError("Unauthorized app usage.", 401);
  ctx.state.shop = shop;
  return next();
};
