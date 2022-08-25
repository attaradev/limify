
export interface ISessionModel {
  id: string;
  payload: {
    shop: string;
    state: string;
    scope: string;
    accessToken: string;
    isOnline: boolean;
    expires: any;
    onlineAccessInfo: any;
  };
  shop: string;
}

export interface IUserModel {
  shop: string;
  scope: string;
  name: string;
  updated_at: Date;
  deleted: boolean;
  user_info: UserInfo;
}

export interface IWebhookModel {
  shop: string;
  webhook_id: string;
  webhook_topic: string;
  payload: any;
  time_received: Date;
}

export type UserInfo = {
  email: string;
  checkoutApiSupported: boolean;
  currencyCode: string;
  currencyFormats: {
    moneyFormat: string;
    moneyWithCurrencyFormat: string;
  };
  customerAccounts: "DISABLED" | "OPTIONAL" | "REQUIRED";
  id: string;
  name: string;
  plan: {
    displayName: string;
    partnerDevelopment: boolean;
    shopifyPlus: boolean;
  };
  url: string;
};
