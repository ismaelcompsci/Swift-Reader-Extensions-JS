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

  // sources/GoodReads/GoodReads.ts
  var GoodReads_exports = {};
  __export(GoodReads_exports, {
    GoodReads: () => GoodReads
  });
  var GOOD_READS = "https://www.goodreads.com/";
  var GoodReads = class {
    constructor(cheerio) {
      this.cheerio = cheerio;
    }
    requestManager = App.createRequestManager({
      requestTimeout: 2e4
    });
    async getHomePageSections(sectionCallback) {
      const request = App.createRequest({
        url: `${GOOD_READS}/list`,
        method: "GET"
      });
      const response = await this.requestManager.request(request);
      const $ = this.cheerio.load(response.data);
      const items = $("div.cell");
      for (let i = 0; i < items.slice(0, 4).length; i++) {
        const element = items[i];
        const list = $(element);
        const a = list.find("a");
        const title = a.text();
        const href = a.attr("href")?.slice(1);
        const booksInfo = list.find("div.listFullDetails").text().trim();
        const numberOfBooks = booksInfo.split(" ");
        const number = parseInt(numberOfBooks[0].replace(",", ""));
        if (href) {
          this.getViewMoreItems(href, void 0).then((results) => {
            const updatedHomeSection = App.createHomeSection({
              id: href ?? String(number) ?? title.replace(" ", "_"),
              containsMoreItems: number > 99,
              title,
              items: results.results
            });
            sectionCallback(updatedHomeSection);
          });
          const homeSection = App.createHomeSection({
            id: href ?? String(number) ?? title.replace(" ", "_"),
            containsMoreItems: number > 20,
            title,
            items: []
          });
          sectionCallback(homeSection);
        }
      }
    }
    async getViewMoreItems(homepageSectionId, metadata) {
      const page = metadata?.page ?? 1;
      const request = App.createRequest({
        url: `${GOOD_READS}${homepageSectionId}?page=${page}`,
        method: "GET"
      });
      const response = await this.requestManager.request(request);
      const $ = this.cheerio.load(response.data);
      const table = $("table.tableList");
      const tableRows = $(table).find(
        'tr[itemscope][itemtype="http://schema.org/Book"]'
      );
      const items = [];
      tableRows.each((_, element) => {
        const row = $(element);
        const tD = row.find('td[width="100%"][valign="top"]');
        const tDImage = row.find('td[width="5%"][valign="top"]');
        const aTag = tD.find("a");
        const link = aTag.attr("href");
        const image = tDImage.find("img").attr("src");
        const title = aTag.find('span[itemprop="name"][role="heading"][aria-level="4"]').text();
        const author = tD.find("a.authorName").text();
        if (!link) {
          return;
        }
        const book = App.createPartialSourceBook({
          id: link,
          title,
          author,
          image
        });
        items.push(book);
      });
      return App.createPagedResults({
        metadata: { page: page + 1 },
        results: items
      });
    }
  };
  return __toCommonJS(GoodReads_exports);
})();
