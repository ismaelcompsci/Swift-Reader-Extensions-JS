import { RequestManager, SourceStateManager } from "../types";
import { LoginResponse } from "./ZTypes";

export interface Credentials {
  email: string;
  password: string;
}

export async function login(
  requestManager: RequestManager,
  stateManager: SourceStateManager,
  credentials: Credentials,
) {
  if (credentials.email == "" || credentials.password == "") {
    return;
  }

  const data = `email=${credentials.email}&password=${credentials.password}`;

  const request = App.createRequest({
    url: `https://z-library.se/eapi/user/login`,
    method: "POST",
    data: data,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const response = await requestManager.request(request);
  const json: LoginResponse =
    typeof response.data === "string"
      ? JSON.parse(response.data)
      : response.data;

  if (json.success == 1) {
    await stateManager.keychain.store("remix_userkey", json.user.remix_userkey);
    await stateManager.keychain.store("remix_userid", json.user.id);
  }
}

export async function getAccessToken(stateManager: SourceStateManager) {
  const remixUserkey: string | undefined =
    await stateManager.keychain.retrieve("remix_userkey");
  const remixUserid: string | undefined =
    await stateManager.keychain.retrieve("remix_userid");

  if (!remixUserkey) return undefined;

  return {
    remixUserid,
    remixUserkey,
  };
}

export async function accountSettings(
  requestManager: RequestManager,
  stateManager: SourceStateManager,
) {
  const accessTokens = await getAccessToken(stateManager);

  if (!accessTokens) {
    return [
      App.createUINavigationButton({
        id: "login_page",
        label: "Login",
        form: App.createUIForm({
          sections: async () => [
            App.createUISection({
              id: "login_section",
              isHidden: false,
              title: "Login",
              rows: async () => [
                App.createUIInputField({
                  id: "email",
                  label: "Email",
                  value: "",
                }),

                App.createUIInputField({
                  id: "password",
                  label: "Password",
                  value: "",
                }),
              ],
            }),
          ],
          onSubmit: async (values) =>
            await login(requestManager, stateManager, values as Credentials),
        }),
      }),

      App.createUILink({
        id: "register_link",
        label: "Register",
        value: "https://singlelogin.se/registration",
      }),
    ];
  }

  return [
    App.createUINavigationButton({
      id: "account_page",
      label: "Account",
      form: App.createUIForm({
        sections: async () => [
          App.createUISection({
            id: "account_info",
            title: "Account",
            isHidden: false,
            rows: async () => [await getAccountInfo(requestManager)],
          }),
        ],
      }),
    }),
  ];
}

async function getAccountInfo(requestManager: RequestManager) {
  const request = App.createRequest({
    url: `https://z-library.se/eapi/user/profile`,
    method: "GET",
  });

  const response = await requestManager.request(request);
  const json: LoginResponse =
    typeof response.data === "string"
      ? JSON.parse(response.data)
      : response.data;

  return App.createUIMultilineLabel({
    id: "account_info",
    label: "Info",
    value: `email: ${json.user.email}\nusername: ${json.user.name}\ndownloads today: ${json.user.downloads_today}`,
  });
}
