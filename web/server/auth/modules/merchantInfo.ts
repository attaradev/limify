import { AxiosInstance } from "axios";
import { getShopifyClient } from "../../utils";
import { UserInfo } from "../../database/types";
import { IMerchantInformation } from "../types";

/**
 * @class Gets a merchant/shop information from shopify, read https://shopify.dev/api/admin-graphql/2022-07/objects/Shop
 * @param {string} _shop - Shopify store identifier for a merchant /^[a-zA-Z0-9][a-zA-Z0-9\-]*.myshopify.com/
 * @param {string} _token -  access token for the shop
 */
class MerchantInformation implements IMerchantInformation {
  shop: string;
  private _client: AxiosInstance;
  constructor(_shop: string, _token: string) {
    this.shop = _shop;
    this._client = getShopifyClient(_shop, _token);
  }
  async fetch(): Promise<UserInfo> {
    const query = `
      query {
        shop {
          billingAddress {
            country
          }
          contactEmail
          checkoutApiSupported
          currencyCode
          currencyFormats {
            moneyFormat
            moneyWithCurrencyFormat
          }
          customerAccounts
          domains {
            host
            id
            localization {
              alternateLocales
              country
              defaultLocale
            }
            sslEnabled
            url
          }
          email
          myshopifyDomain            
          id
          name
          plan {
            displayName
            partnerDevelopment
            shopifyPlus
          }
          timezoneOffset
          timezoneAbbreviation
          primaryDomain {
            host
            id
            localization {
              alternateLocales
              country
              defaultLocale
            }
            sslEnabled
            url
          }
          url
        }
      }
    `;
    const { data } = await this._client.post("/graphql.json", { query });
    const payload = data.data.shop;
    return payload;
  }
}

export default MerchantInformation;
