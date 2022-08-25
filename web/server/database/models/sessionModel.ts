import mongoose from "mongoose";
import { ISessionModel } from "../types";

const Schema = mongoose.Schema;

const sessionSchema = new Schema({
  id: String,
  payload: new Schema({
    shop: String,
    state: String,
    scope: String,
    accessToken: String,
    isOnline: Boolean,
    expires: Schema.Types.Mixed,
    onlineAccessInfo: Schema.Types.Mixed,
  }),
  shop: String,
});

const Session = mongoose.model<ISessionModel>(
  "Session",
  sessionSchema,
  "sessions"
);
export default Session;
