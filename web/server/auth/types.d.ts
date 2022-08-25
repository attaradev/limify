import { UserInfo } from "../database/types";
export interface IMerchantInformation {
  shop: string;
  fetch(): Promise<UserInfo>;
}
