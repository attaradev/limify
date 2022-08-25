import mongoose from "mongoose";
import { IUserModel } from "../types";

const Schema = mongoose.Schema;

const userSchema = new Schema({
  shop: { type: String, required: [true, "A user must be linked to a shop"] },
  scope: { type: String, required: [true, "A user's scope must be recorded"] },
  name: String,
  deleted: { type: Boolean, default: false },
  updated_at: Date,
  user_info: new Schema({
    email: String,
    checkoutApiSupported: Boolean,
    currencyCode: String,
    currencyFormats: {
      moneyFormat: String,
      moneyWithCurrencyFormat: String,
    },
    customerAccounts: {
      type: String,
      enum: ["DISABLED", "OPTIONAL", "REQUIRED"],
    },
    id: String,
    name: String,
    plan: {
      displayName: String,
      partnerDevelopment: Boolean,
      shopifyPlus: Boolean,
    },
    url: String,
  }),
});

const User = mongoose.model<IUserModel>("User", userSchema, "users");
export default User;
