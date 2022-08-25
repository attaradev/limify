import { AxiosInstance } from "axios";
import { getShopifyClient, handleShopifyGQLError } from "../../utils";
import { IWebhook } from "../types";

/**
 * @class Registers / deletes a webhook subscription, read https://shopify.dev/api/admin-graphql/2022-07/mutations/webhookSubscriptionCreate , https://shopify.dev/api/admin-graphql/2022-07/mutations/webhookSubscriptionDelete
 * @param {string} _shop - Shopify store identifier for a merchant /^[a-zA-Z0-9][a-zA-Z0-9\-]*.myshopify.com/
 * @param {string} _token -  access token for the shop
 */
class Webhook implements IWebhook {
  shop: string;
  private _client: AxiosInstance;
  constructor(_shop: string, _token: string) {
    this.shop = _shop;
    this._client = getShopifyClient(_shop, _token);
  }
  private async _getWebhooks(_topic: string) {
    const query = `
      query {
        webhookSubscriptions(
          first: 1
           topics:[${_topic}]
        ) {
          nodes {
            id
            topic
            endpoint {
              __typename
              ... on WebhookHttpEndpoint {
                callbackUrl
              }
            }
          }
        }
      }
    `;
    const { data } = await this._client.post("/graphql.json", { query });
    if (data.errors?.length) handleShopifyGQLError(data.errors);
    return data.data.webhookSubscriptions?.nodes;
  }
  private async _writeWebhook(
    _HOST: string,
    _topic: string,
    _endpoint: string
  ) {
    const query = `
      mutation {
        webhookSubscriptionCreate(
          topic: ${_topic}
          webhookSubscription: {
            callbackUrl: "${_HOST}/webhooks/${_endpoint}"
            format: JSON
          }
        ) {
          webhookSubscription {
            id
            topic
            endpoint {
              __typename
              ... on WebhookHttpEndpoint {
                callbackUrl
              }
            }
          }
          userErrors {
            message
            field
          }
        }
      }
    `;
    const { data } = await this._client.post("/graphql.json", { query });
    if (data.errors?.length) handleShopifyGQLError(data.errors);
    const queryErrors = data.data.webhookSubscriptionCreate.userErrors;
    if (queryErrors.length) handleShopifyGQLError(queryErrors);
    return data.data.webhookSubscriptionCreate.webhookSubscription;
  }
  private async _deleteWebhook(_id: string): Promise<string> {
    const query = `
      mutation {
        webhookSubscriptionDelete(
          id: "${_id}"
        ) {
          deletedWebhookSubscriptionId
          userErrors {
            message
            field
          }
        }
      }
    `;
    const { data } = await this._client.post("/graphql.json", { query });
    if (data.errors?.length) handleShopifyGQLError(data.errors);
    const queryErrors = data.data.webhookSubscriptionDelete.userErrors;
    if (queryErrors.length) handleShopifyGQLError(queryErrors);
    return data.data.webhookSubscriptionDelete.deletedWebhookSubscriptionId;
  }
  private async _updateWebhook(
    _id: string,
    _HOST: string,
    _endpoint: string
  ): Promise<string> {
    const query = `
      mutation webhookSubscriptionUpdate(
        $id: ID!
        $webhookSubscription: WebhookSubscriptionInput!
      ) {
        webhookSubscriptionUpdate(
          id: $id
          webhookSubscription: $webhookSubscription
        ) {
          userErrors {
            field
            message
          }
          webhookSubscription {
            id
            topic
            endpoint {
              __typename
              ... on WebhookHttpEndpoint {
                callbackUrl
              }
            }
          }
        }
      }
    `;
    const { data } = await this._client.post("/graphql.json", {
      query,
      variables: {
        id: _id,
        webhookSubscription: {
          callbackUrl: `${_HOST}/webhooks/${_endpoint}`,
        },
      },
    });
    if (data.errors?.length) handleShopifyGQLError(data.errors);
    const queryErrors = data.data.webhookSubscriptionUpdate.userErrors;
    if (queryErrors.length) handleShopifyGQLError(queryErrors);
    return data.data.webhookSubscriptionUpdate.webhookSubscription;
  }
  async register(_HOST: string, _endpoint: string, _topic: string) {
    const webhooks = await this._getWebhooks(_topic);
    const url = `${_HOST}/webhooks/${_endpoint}`;
    const exists = webhooks.some(
      (webhook: any) =>
        _topic == webhook.topic && url == webhook.endpoint.callbackUrl
    );
    if (exists) return;
    if (webhooks.length)
      await this._updateWebhook(webhooks[0].id, _HOST, _endpoint);
    else await this._writeWebhook(_HOST, _topic, _endpoint);
  }
  /**
   * Deletes the specified webhook subscription
   * @param {string} _topic -  Webhook topic to delete
   */
  async delete(_topic: string) {
    const webhooks = await this._getWebhooks(_topic);
    if (webhooks.length) {
      for (const webhook of webhooks) {
        await this._deleteWebhook(webhook.id);
      }
    }
  }
}

export default Webhook;
