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

  // sources/Libgen/Libgen.ts
  var Libgen_exports = {};
  __export(Libgen_exports, {
    Libgen: () => Libgen
  });
  var BASEURL = "https://libgen.is";
  var Libgen = class {
    constructor(cheerio) {
      this.cheerio = cheerio;
    }
    requestManager = App.createRequestManager({
      requestTimeout: 1e4
    });
    async getBookDetails(id) {
      const request = App.createRequest({
        url: `${BASEURL}/book/index.php?md5=${id}`,
        method: "GET"
      });
      const response = await this.requestManager.request(request);
      const $ = this.cheerio.load(response.data);
      const title = $("td > b > a");
      const author = $($("tr > td > b")[1]).text();
      const img = $("img").first().attr("src");
      const rows = $("tr");
      const tagRow = rows[22];
      const tags = $(tagRow.children[1]).text().split("\\\\");
      const fileExtension = $(rows[18].children[4]).text();
      const ext = ".".concat(fileExtension);
      const links = $("a").map((i, elm) => {
        if ($(elm).attr("title")?.toLowerCase().startsWith("libgen")) {
          return elm.attribs["href"];
        }
      }).toArray();
      const promises = [];
      for (let link in links) {
        var httpsLink = link;
        if (link.startsWith("http:")) {
          httpsLink = link.replace("http:", "https:");
        }
        const request2 = App.createRequest({
          url: links[httpsLink],
          method: "GET"
        });
        promises.push(this.requestManager.request(request2));
      }
      const downloadMirrors = await Promise.all(promises);
      const downloadLinks = [];
      downloadMirrors.forEach((res) => {
        const isLibgenLi = res.request.url.includes("libgen.li");
        const isLibraryLOL = res.request.url.includes("library.lol");
        const $2 = this.cheerio.load(res.data);
        if (isLibraryLOL) {
          const aHref = $2("h2 > a").first().attr("href");
          if (aHref) {
            downloadLinks.push(
              App.createDownloadInfo({
                filetype: ext,
                link: aHref
              })
            );
          }
        }
        if (isLibgenLi) {
          const aHref = $2("a > h2").parent().first().attr("href");
          if (aHref) {
            downloadLinks.push(
              App.createDownloadInfo({
                filetype: ext,
                link: `https://libgen.li/${aHref}`
              })
            );
          }
        }
      });
      return App.createSourceBook({
        id,
        bookInfo: App.createBookInfo({
          downloadLinks,
          title: title.text(),
          author,
          image: `${BASEURL}${img}`,
          tags: tags[0] === "" ? [] : tags
        })
      });
    }
    async getSearchResults(query, metadata) {
      const page = metadata?.page ?? 1;
      const request = App.createRequest({
        url: `${BASEURL}/search.php?req=${query.title}&open=0&res=25&view=detailed&phrase=1&column=def&page=${page}`,
        method: "GET"
      });
      const response = await this.requestManager.request(request);
      const $ = this.cheerio.load(response.data);
      const tables = $("table");
      const books = [];
      for (let elm of tables) {
        const table = $(elm);
        const image = table.find("img").first().attr("src");
        if (!image) {
          continue;
        }
        const titleAtag = table.find("tbody tr td b a").first();
        const title = titleAtag.text();
        const id = titleAtag.attr("href")?.split("=").pop()?.toLowerCase();
        const authorAtags = table.find("tbody tr td b a")[1];
        const author = $(authorAtags).text();
        if (!id) {
          continue;
        }
        books.push(
          App.createPartialSourceBook({
            id,
            title,
            author,
            image: `${BASEURL}${image}`
          })
        );
      }
      return App.createPagedResults({
        metadata: { page: page + 1 },
        results: books
      });
    }
  };
  return __toCommonJS(Libgen_exports);
})();
