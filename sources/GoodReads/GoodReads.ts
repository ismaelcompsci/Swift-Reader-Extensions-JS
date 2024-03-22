import { CheerioAPI } from "cheerio/lib/load";
import { PagedResults, PartialSourceBook, HomeSection } from "../types";

const GOOD_READS = "https://www.goodreads.com/";

export class GoodReads {
  constructor(private cheerio: CheerioAPI) {}

  requestManager = App.createRequestManager({
    requestTimeout: 20_000,
  });

  async getHomePageSections(
    sectionCallback: (section: HomeSection) => void,
  ): Promise<void> {
    const request = App.createRequest({
      url: `${GOOD_READS}/list`,
      method: "GET",
    });

    const response = await this.requestManager.request(request);
    const $ = this.cheerio.load(response.data as string);

    const items = $("div.cell");

    for (let i = 0; i < items.length; i++) {
      const element = items[i];
      const list = $(element);
      const a = list.find("a");
      const title = a.text();
      const href = a.attr("href")?.slice(1);
      const booksInfo = list.find("div.listFullDetails").text().trim();
      const numberOfBooks = booksInfo.split(" ");
      const number = parseInt(numberOfBooks[0].replace(",", ""));

      if (href) {
        this.getViewMoreItems(href, undefined).then((results) => {
          const updatedHomeSection = App.createHomeSection({
            id: href ?? String(number) ?? title.replace(" ", "_"),
            containsMoreItems: number > 100,
            title: title,
            items: results.results.slice(0, 20),
          });

          sectionCallback(updatedHomeSection);
        });

        const homeSection = App.createHomeSection({
          id: href ?? String(number) ?? title.replace(" ", "_"),
          containsMoreItems: number > 100,
          title: title,
          items: [],
        });

        sectionCallback(homeSection);
      }
    }
  }

  async getViewMoreItems(
    homepageSectionId: string,
    metadata: any,
  ): Promise<PagedResults> {
    const page: number = metadata?.page ?? 1;
    const request = App.createRequest({
      url: `${GOOD_READS}${homepageSectionId}?page=${page}`,
      method: "GET",
    });

    const response = await this.requestManager.request(request);
    const $ = this.cheerio.load(response.data as string);

    const table = $("table.tableList");
    const tableRows = $(table).find(
      'tr[itemscope][itemtype="http://schema.org/Book"]',
    );

    const items: PartialSourceBook[] = [];

    tableRows.each((_, element) => {
      const row = $(element);
      const tD = row.find('td[width="100%"][valign="top"]');
      const tDImage = row.find('td[width="5%"][valign="top"]');
      const aTag = tD.find("a");
      const link = aTag.attr("href");
      const image = tDImage.find("img").attr("src");
      const title = aTag
        .find('span[itemprop="name"][role="heading"][aria-level="4"]')
        .text();
      const author = tD.find("a.authorName").text();

      if (!link) {
        return;
      }

      const book = App.createPartialSourceBook({
        id: link,
        title: title,
        author: author,
        image: image,
      });

      items.push(book);
    });

    return App.createPagedResults({
      metadata: { page: page + 1 },
      results: items,
    });
  }
}

// delete before build
// @ts-ignore
// globalThis.App = new Proxy(
//   {},
//   {
//     get(target, p) {
//       // @ts-ignore
//       if (target[p]) {
//         // @ts-ignore
//         return target[p];
//       }

//       if (typeof p === "string" && p.startsWith("create")) {
//         return (anyProps: any) => anyProps;
//       }

//       return undefined;
//     },
//   },
// );
