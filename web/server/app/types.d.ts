export interface IWebhook {
  shop: string;
  register(_HOST: string, _endpoint: string, _topic: string): Promise<void>;
  delete(_shop: string, _token: string, _topic: string): Promise<void>;
}
