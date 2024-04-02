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

  // sources/AnnasArchive/AnnasArchive.ts
  var AnnasArchive_exports = {};
  __export(AnnasArchive_exports, {
    AnnasArchive: () => AnnasArchive
  });
  var AA_BASEURL = "https://annas-archive.org";
  var AnnasArchive = class {
    constructor(cheerio) {
      this.cheerio = cheerio;
    }
    requestManager = App.createRequestManager({
      requestTimeout: 2e4
    });
    async getBookDetails(id) {
      const request = App.createRequest({
        url: `${AA_BASEURL}/md5/${id}`,
        method: "GET"
      });
      const response = await this.requestManager.request(request);
      if (!response || !response.data) {
        throw new Error("No book details");
      }
      const $ = this.cheerio.load(response.data);
      const title = $("div.text-3xl.font-bold").first().text().replace("\u{1F50D}", "").trim();
      const author = $("div.italic").first().text().replace("\u{1F50D}", "").trim();
      const description = $("div.js-md5-top-box-description").first().text().replace("\u{1F50D}", "").trim();
      const thumbnail = $("img").attr("src");
      const dlLinksHTML = $("a.js-download-link");
      const info = $("div.text-sm.text-gray-500").first().text();
      let infoList = info.split(", ");
      let language = void 0;
      if (infoList[0].includes("[")) {
        language = infoList.shift();
      }
      let extension = infoList.shift();
      let size = infoList.shift();
      let downloadLinks = [];
      dlLinksHTML.each((_, element) => {
        let link = $(element).attr("href");
        if (link === "/datasets" || link?.startsWith("/")) {
          return;
        }
        if (link && extension && (link.includes("ipfs.com") || link.includes("ipfs.io") || link.includes("ipfs"))) {
          downloadLinks.push(
            App.createDownloadInfo({
              filetype: extension,
              link
            })
          );
        }
      });
      return App.createSourceBook({
        id,
        bookInfo: App.createBookInfo({
          title,
          desc: description,
          author,
          image: thumbnail,
          downloadLinks
        })
      });
    }
    async getSearchResults(query, metadata) {
      const request = App.createRequest({
        url: `${AA_BASEURL}/search?q=${query.title}`,
        method: "GET"
      });
      const response = await this.requestManager.request(request);
      const $ = this.cheerio.load(response.data);
      const books = [];
      $("*").contents().each((index, node) => {
        if (node.nodeType === 8) {
          if (node.data.includes("/md5/")) {
            $("body").append(node.data);
          }
        }
      });
      $("a.js-vim-focus").each((index, element) => {
        const $s = $(element);
        const title = $s.find("h3").first().text();
        const thumbnail = $s.find("img").first().attr("src");
        const id = element.attribs["href"].replace("/md5/", "");
        const author = $s.find(
          'div[class="max-lg:line-clamp-[2] lg:truncate leading-[1.2] lg:leading-[1.35] max-lg:text-sm italic"]'
        ).first().text();
        if (id && title) {
          books.push(
            App.createPartialSourceBook({
              id,
              title,
              image: thumbnail,
              author
            })
          );
        }
      });
      return App.createPagedResults({
        results: books
      });
    }
  };
  return __toCommonJS(AnnasArchive_exports);
})();
