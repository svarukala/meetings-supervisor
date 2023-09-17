import config from "../config";
const { Client } = require("@microsoft/microsoft-graph-client");
const { TokenCredentialAuthenticationProvider } = require("@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials");
const { ClientSecretCredential } = require("@azure/identity");

export class GraphClient {
    static getGraphClient() {

        console.log("Getting Graph Client");
        console.log(config.clientId);
        console.log(config.clientSecret);
        const credential = new ClientSecretCredential(config.tenantId, config.clientId, config.clientSecret);
        const authProvider = new TokenCredentialAuthenticationProvider(credential, {
            scopes: ['https://graph.microsoft.com/.default']
        });

        const client = Client.initWithMiddleware({
            debugLogging: true,
            authProvider
        });
        return client;
    }
}