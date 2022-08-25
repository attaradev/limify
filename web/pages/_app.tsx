// @ts-nocheck
import React from "react";
import ApolloClient from "apollo-boost";
import { ApolloProvider } from "react-apollo";
import App, { AppContext } from "next/app";
import getConfig from "next/config";
import { AppProvider } from "@shopify/polaris";
import { Provider, useAppBridge } from "@shopify/app-bridge-react";
import { authenticatedFetch } from "@shopify/app-bridge-utils";
import { Redirect } from "@shopify/app-bridge/actions";
import { Response } from "node-fetch";
import "@shopify/polaris/build/esm/styles.css";
import translations from "@shopify/polaris/locales/en.json";

function userLoggedInFetch(app: any) {
  const fetchFunction = authenticatedFetch(app);

  return async (
    uri: globalThis.RequestInfo,
    options: globalThis.RequestInit
  ): Promise<globalThis.Response | null> => {
    const response = await fetchFunction(uri, options);

    if (
      response.headers.get("X-Shopify-API-Request-Failure-Reauthorize") === "1"
    ) {
      const authUrlHeader = response.headers.get(
        "X-Shopify-API-Request-Failure-Reauthorize-Url"
      );

      const redirect = Redirect.create(app);
      redirect.dispatch(Redirect.Action.APP, authUrlHeader || `/auth`);
      return null;
    }
    return response;
  };
}

function MyProvider(props: any) {
  const app = useAppBridge();
  const fetch = userLoggedInFetch(app);

  const client = new ApolloClient({
    fetch,
    fetchOptions: {
      credentials: "include",
    },
  });

  const Component = props.Component;

  return (
    <ApolloProvider client={client}>
      <Component {...props} />
    </ApolloProvider>
  );
}
const { publicRuntimeConfig } = getConfig();
class MyApp extends App {
  render() {
    const { Component, pageProps, host } = this.props;
    return (
      <AppProvider i18n={translations}>
        <Provider
          config={{
            apiKey: publicRuntimeConfig.API_KEY,
            host: host,
            forceRedirect: false,
          }}
        >
          <MyProvider Component={Component} {...pageProps} />
        </Provider>
      </AppProvider>
    );
  }
}

MyApp.getInitialProps = async ({ ctx }: AppContext) => {
  return {
    host: ctx.query.host,
  };
};

export default MyApp;
