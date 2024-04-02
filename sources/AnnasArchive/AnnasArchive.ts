import { CheerioAPI } from "cheerio/lib/load";
import {
  SourceBook,
  PagedResults,
  PartialSourceBook,
  SearchRequest,
  DownloadInfo,
} from "../types";

const AA_BASEURL = "https://annas-archive.org";

export class AnnasArchive {
  constructor(private cheerio: CheerioAPI) {}

  requestManager = App.createRequestManager({
    requestTimeout: 20_000,
  });

  async getBookDetails(id: string): Promise<SourceBook> {
    const request = App.createRequest({
      url: `${AA_BASEURL}/md5/${id}`,
      method: "GET",
    });

    const response = await this.requestManager.request(request);

    if (!response || !response.data) {
      throw new Error("No book details");
    }

    const $ = this.cheerio.load(response.data as string);

    const title = $("div.text-3xl.font-bold")
      .first()
      .text()
      .replace("🔍", "")
      .trim();

    const author = $("div.italic").first().text().replace("🔍", "").trim();

    const description = $("div.js-md5-top-box-description")
      .first()
      .text()
      .replace("🔍", "")
      .trim();

    const thumbnail = $("img").attr("src");

    const dlLinksHTML = $("a.js-download-link");
    const info = $("div.text-sm.text-gray-500").first().text();

    let infoList = info.split(", ");
    let language: string | undefined = undefined;
    if (infoList[0].includes("[")) {
      language = infoList.shift();
    }
    let extension = infoList.shift();
    let size = infoList.shift();

    let downloadLinks: DownloadInfo[] = [];
    dlLinksHTML.each((_, element) => {
      let link = $(element).attr("href");

      if (link === "/datasets" || link?.startsWith("/")) {
        return;
      }

      if (
        link &&
        extension &&
        (link.includes("ipfs.com") ||
          link.includes("ipfs.io") ||
          link.includes("ipfs"))
      ) {
        downloadLinks.push(
          App.createDownloadInfo({
            filetype: extension,
            link: link,
          }),
        );
      }
    });

    return App.createSourceBook({
      id: id,
      bookInfo: App.createBookInfo({
        title: title,
        desc: description,
        author: author,
        image: thumbnail,
        downloadLinks: downloadLinks,
      }),
    });
  }

  async getSearchResults(
    query: SearchRequest,
    metadata: any,
  ): Promise<PagedResults> {
    const request = App.createRequest({
      url: `${AA_BASEURL}/search?q=${query.title}`,
      method: "GET",
    });

    const response = await this.requestManager.request(request);

    const $ = this.cheerio.load(response.data as string);
    const books: PartialSourceBook[] = [];

    // get partial results
    $("*")
      .contents()
      .each((index, node) => {
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
      const author = $s
        .find(
          'div[class="max-lg:line-clamp-[2] lg:truncate leading-[1.2] lg:leading-[1.35] max-lg:text-sm italic"]',
        )
        .first()
        .text();

      if (id && title) {
        books.push(
          App.createPartialSourceBook({
            id: id,
            title: title,
            image: thumbnail,
            author: author,
          }),
        );
      }
    });

    return App.createPagedResults({
      results: books,
    });
  }
}
