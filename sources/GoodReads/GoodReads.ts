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
    const sections = [
      App.createHomeSection({
        id: "list/show/1230.Best_Gothic_Books_Of_All_Time",
        title: "Best Gothic Books Of All Time",
        containsMoreItems: true,
      }),

      App.createHomeSection({
        id: "list/show/143500.Best_Books_of_the_Decade_2020_s",
        title: "Best Books of the Decade: 2020's",
        containsMoreItems: true,
      }),

      App.createHomeSection({
        id: "list/show/201200.The_top_100_classics_according_to_active_members_of_Catching_up_on_Classics_group",
        title: "The top 100 classics",
        containsMoreItems: true,
      }),

      App.createHomeSection({
        id: "list/show/264.Books_That_Everyone_Should_Read_At_Least_Once",
        title: "Books That Everyone Should Read At Least Once",
        containsMoreItems: true,
      }),
    ];

    const promises: Promise<void>[] = [];

    for (const section of sections) {
      sectionCallback(section);

      const request = App.createRequest({
        url: `${GOOD_READS}${section.id}`,
        method: "GET",
      });

      promises.push(
        this.requestManager.request(request).then((response) => {
          // this is the bottleneck alot of html being parsed
          const $ = this.cheerio.load(response.data as string);

          section.items = parseGoodReadsList($, true);
          sectionCallback(section);
        }),
      );
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

    const items = parseGoodReadsList($, false);

    return App.createPagedResults({
      metadata: { page: page + 1 },
      results: items,
    });
  }
}

const parseGoodReadsList = (
  $: CheerioAPI,
  isHomePageSection: boolean,
): PartialSourceBook[] => {
  const items: PartialSourceBook[] = [];
  const tableRows = $(
    "table.tableList tr[itemscope][itemtype='http://schema.org/Book']",
  );

  let tableRowCount = isHomePageSection
    ? Math.min(tableRows.length, 25)
    : tableRows.length;

  for (let i = 0; i < tableRowCount - 1; i++) {
    const element = tableRows[i];

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
      continue;
    }

    const book = App.createPartialSourceBook({
      id: link,
      title: title,
      author: author,
      image: image,
    });

    items.push(book);
  }

  return items;
};
