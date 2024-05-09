var source = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // sources/ZLibrary/ZLibrary.ts
  var ZLibrary_exports = {};
  __export(ZLibrary_exports, {
    ZLibrary: () => ZLibrary
  });

  // sources/ZLibrary/Setttings.ts
  async function login(requestManager, stateManager, credentials) {
    if (credentials.email == "" || credentials.password == "") {
      return;
    }
    const data = `email=${credentials.email}&password=${credentials.password}`;
    const request = App.createRequest({
      url: `https://z-library.se/eapi/user/login`,
      method: "POST",
      data,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
    const response = await requestManager.request(request);
    const json = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
    if (json.success == 1) {
      await stateManager.keychain.store("remix_userkey", json.user.remix_userkey);
      await stateManager.keychain.store("remix_userid", json.user.id);
    }
  }
  async function getAccessToken(stateManager) {
    const remixUserkey = await stateManager.keychain.retrieve("remix_userkey");
    const remixUserid = await stateManager.keychain.retrieve("remix_userid");
    if (!remixUserkey)
      return void 0;
    return {
      remixUserid,
      remixUserkey
    };
  }
  async function accountSettings(requestManager, stateManager) {
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
                    value: ""
                  }),
                  App.createUIInputField({
                    id: "password",
                    label: "Password",
                    value: ""
                  })
                ]
              })
            ],
            onSubmit: async (values) => await login(requestManager, stateManager, values)
          })
        }),
        App.createUINavigationButton({
          id: "register_page",
          label: "Register",
          form: App.createUIForm({
            // @ts-ignore
            id: "register_form_itme",
            sections: async () => [
              App.createUISection({
                id: "register_form",
                isHidden: false,
                title: "Register Form",
                rows: async () => [
                  App.createUIInputField({
                    id: "email",
                    label: "Email",
                    value: ""
                  }),
                  App.createUIInputField({
                    id: "username",
                    label: "Username",
                    value: ""
                  }),
                  App.createUIInputField({
                    id: "password",
                    label: "Password",
                    value: ""
                  })
                ]
              })
            ],
            onSubmit: async (values) => {
            }
          })
        })
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
              rows: async () => [await getAccountInfo(requestManager)]
            })
          ]
        })
      })
    ];
  }
  async function getAccountInfo(requestManager) {
    const request = App.createRequest({
      url: `https://z-library.se/eapi/user/profile`,
      method: "GET"
    });
    const response = await requestManager.request(request);
    const json = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
    return App.createUIMultilineLabel({
      id: "account_info",
      label: "Info",
      value: `email: ${json.user.email}
username: ${json.user.name}
downloads today: ${json.user.downloads_today}`
    });
  }

  // sources/ZLibrary/ZLibrary.ts
  var ZLibrary = class {
    constructor(cheerio) {
      this.cheerio = cheerio;
    }
    BASE_URL = "https://z-library.se";
    stateManager = App.createSourceStateManager();
    requestManager = App.createRequestManager({
      requestTimeout: 1e4,
      interceptor: {
        interceptRequest: async (request) => {
          const accountTokens = await getAccessToken(this.stateManager);
          if (!accountTokens) {
            return request;
          }
          request.headers = {
            ...request.headers,
            Cookies: `remix_userid=${accountTokens.remixUserid};remix_userkey=${accountTokens.remixUserkey}`
          };
          return request;
        }
      }
    });
    async getSourceMenu() {
      return App.createUISection({
        id: "source_settings",
        isHidden: false,
        title: "Source Settings",
        rows: async () => [
          ...await accountSettings(this.requestManager, this.stateManager)
        ]
      });
    }
    async getBookDetails(id) {
      const request = App.createRequest({
        url: `${this.BASE_URL}${id}`,
        method: "GET"
      });
      const response = await this.requestManager.request(request);
      const data = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
      const fileRequest = App.createRequest({
        url: `${this.BASE_URL}${id}/file`,
        method: "GET"
      });
      const fileResponse = await this.requestManager.request(fileRequest);
      const fileInfo = typeof fileResponse.data === "string" ? JSON.parse(fileResponse.data) : fileResponse.data;
      const downloadLink = App.createDownloadInfo({
        link: fileInfo.file.downloadLink,
        filetype: fileInfo.file.extension
      });
      return App.createSourceBook({
        id,
        bookInfo: App.createBookInfo({
          title: data.book.title,
          author: data.book.author,
          image: data.book.cover,
          downloadLinks: [downloadLink],
          desc: data.book.description
        })
      });
    }
    async getHomePageSections(sectionCallback) {
      const request = App.createRequest({
        url: `${this.BASE_URL}/eapi/book/most-popular`,
        method: "GET"
      });
      sectionCallback(
        App.createHomeSection({
          id: "most-popular",
          title: "Most Popular",
          containsMoreItems: false
        })
      );
      const response = await this.requestManager.request(request);
      const data = JSON.parse(
        response.data ?? "{}"
      );
      var pbooks = [];
      for (let book of data.books) {
        pbooks.push(
          App.createPartialSourceBook({
            id: `/eapi/book/${book.id}/${book.hash}`,
            title: book.title,
            author: book.author,
            image: book.cover
          })
        );
      }
      sectionCallback(
        App.createHomeSection({
          id: "most-popular",
          title: "Most Popular",
          containsMoreItems: false,
          items: pbooks
        })
      );
    }
    async getSearchResults(query, metadata) {
      const page = metadata?.page ?? 1;
      const limit = 100;
      const request = App.createRequest({
        url: `${this.BASE_URL}/eapi/book/search`,
        method: "POST",
        data: JSON.stringify({
          message: query.title,
          page,
          limit,
          extensions: [
            "AZW3" /* AZW3 */,
            "EPUB" /* EPUB */,
            "FB2" /* FB2 */,
            "MOBI" /* MOBI */,
            "PDF" /* PDF */
          ]
        })
      });
      const response = await this.requestManager.request(request);
      const data = JSON.parse(response.data ?? "{}");
      var pbooks = [];
      for (let book of data.books) {
        pbooks.push(
          App.createPartialSourceBook({
            id: `/eapi/book/${book.id}/${book.hash}`,
            title: book.title,
            author: book.author,
            image: book.cover
          })
        );
      }
      return App.createPagedResults({
        results: pbooks,
        metadata: { page: page + 1 }
      });
    }
  };
  return __toCommonJS(ZLibrary_exports);
})();
