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
          console.log("INTERCEPTING REQUEST");
          var valueFromState = this.stateManager.retrieve("test");
          if (!valueFromState)
            return request;
          return request;
        }
      }
    });
    async getBookDetails(id) {
      const request = App.createRequest({
        url: `${this.BASE_URL}${id}`,
        method: "GET"
      });
      const response = await this.requestManager.request(request);
      const data = JSON.parse(
        response.data ?? "{}"
      );
      return App.createSourceBook({
        id,
        bookInfo: App.createBookInfo({
          title: data.book.title,
          author: data.book.author,
          image: data.book.cover,
          downloadLinks: [],
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
