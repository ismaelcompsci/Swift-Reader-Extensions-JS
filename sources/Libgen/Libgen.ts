import { CheerioAPI } from "cheerio/lib/load";
import {
  SourceBook,
  PagedResults,
  PartialSourceBook,
  SearchRequest,
  DownloadInfo,
  Response,
} from "../types";

const BASEURL = "https://libgen.is";

export class Libgen {
  constructor(private cheerio: CheerioAPI) {}

  requestManager = App.createRequestManager({
    requestTimeout: 10_000,
  });

  async getBookDetails(id: string): Promise<SourceBook> {
    const request = App.createRequest({
      url: `${BASEURL}/book/index.php?md5=${id}`,
      method: "GET",
    });

    const response = await this.requestManager.request(request);

    const $ = this.cheerio.load(response.data as string);

    const title = $("td > b > a");
    const author = $($("tr > td > b")[1]).text();
    const img = $("img").first().attr("src");

    const rows = $("tr");
    const tagRow = rows[22];
    const tags = $(tagRow.children[1]).text().split("\\\\");

    const fileExtension = $(rows[18].children[4]).text();
    const ext = ".".concat(fileExtension);

    const links = $("a")
      .map((i, elm) => {
        if ($(elm).attr("title")?.toLowerCase().startsWith("libgen")) {
          return elm.attribs["href"];
        }
      })
      .toArray();

    const promises: Promise<Response>[] = [];
    links.forEach((link) => {
      var httpsLink = link;

      if (link[4] == ":") {
        httpsLink = httpsLink.replace("http", "https");
      }

      const request = App.createRequest({
        url: httpsLink,
        method: "GET",
      });
      promises.push(this.requestManager.request(request));
    });

    const downloadMirrors = await Promise.all(promises);

    const downloadLinks: DownloadInfo[] = [];

    downloadMirrors.forEach((res) => {
      const isLibgenLi = res.request.url.includes("libgen.li");
      const isLibraryLOL = res.request.url.includes("library.lol");
      const $ = this.cheerio.load(res.data as string);

      if (isLibraryLOL) {
        const aHref = $("h2 > a").first().attr("href");
        if (aHref) {
          downloadLinks.push(
            App.createDownloadInfo({
              filetype: ext,
              link: aHref,
            }),
          );
        }
      }

      if (isLibgenLi) {
        const aHref = $("a > h2").parent().first().attr("href");
        if (aHref) {
          downloadLinks.push(
            App.createDownloadInfo({
              filetype: ext,
              link: `https://libgen.li/${aHref}`,
            }),
          );
        }
      }
    });

    return App.createSourceBook({
      id: id,
      bookInfo: App.createBookInfo({
        downloadLinks: downloadLinks,
        title: title.text(),
        author: author,
        image: `${BASEURL}${img}`,
        tags: tags[0] === "" ? [] : tags,
      }),
    });
  }
  async getSearchResults(
    query: SearchRequest,
    metadata: any,
  ): Promise<PagedResults> {
    const page = metadata?.page ?? 1;
    const request = App.createRequest({
      url: `${BASEURL}/search.php?req=${query.title ?? ""}&open=0&res=25&view=detailed&phrase=1&column=def&page=${page}`,
      method: "GET",
    });

    const response = await this.requestManager.request(request);

    const $ = this.cheerio.load(response.data as string);

    const tables = $("table");

    const books: PartialSourceBook[] = [];
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
          image: `${BASEURL}${image}`,
        }),
      );
    }

    return App.createPagedResults({
      metadata: { page: page + 1 },
      results: books,
    });
  }
}
