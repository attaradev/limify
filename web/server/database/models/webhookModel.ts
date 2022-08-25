import mongoose from "mongoose";
import { IWebhookModel } from "../types";

const Schema = mongoose.Schema;

const webhookSchema = new Schema({
  shop: String,
  webhook_id: String,
  webhook_topic: String,
  payload: Object,
  time_received: Date,
});

const Webhook = mongoose.model<IWebhookModel>(
  "Webhook",
  webhookSchema,
  "webhooks"
);
export default Webhook;
