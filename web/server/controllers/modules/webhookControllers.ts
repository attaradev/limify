import { Context } from "koa";
import { removeSession } from "../../auth";
import {  saveWebhook } from "../../utils/lib/library";

export const webhookController = async (ctx: Context) => {
  const { shop, topic, id, payload } = ctx.state;

  const data = {
    shop,
    webhook_id: id,
    webhook_topic: topic,
    payload,
    time_received: Date.now(),
  };

  await saveWebhook(data);
  if (topic == "app/uninstalled") await removeSession(shop);
  ctx.body = {
    statusCode: 200,
    message: "Webhook successfully processed",
  };
  ctx.response.status = 200;
};
