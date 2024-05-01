import { CheerioAPI } from "cheerio/lib/load";
import {
  HomeSection,
  PagedResults,
  PartialSourceBook,
  SearchRequest,
  SourceBook,
  Request,
} from "../types";
import {
  MostPopularResponse,
  SearchResponse,
  ZLibraryBookInfoResponse,
} from "./ZTypes";

enum FileExtension {
  TXT = "TXT",
  PDF = "PDF",
  FB2 = "FB2",
  EPUB = "EPUB",
  LIT = "LIT",
  MOBI = "MOBI",
  RTF = "RTF",
  DJV = "DJV",
  DJVU = "DJVU",
  AZW = "AZW",
  AZW3 = "AZW3",
}

const DOMAINS = [
  "z-library.se",
  "z-library.rs",
  "singlelogin.re",
  "zlibrary-global.se",
  "1lib.sk",
  "zlibrary-asia.se",
  "zlibrary-east.se",
  "zlibrary-in.se",
];

export class ZLibrary {
  BASE_URL = "https://z-library.se";

  constructor(private cheerio: CheerioAPI) {}

  stateManager = App.createSourceStateManager();

  requestManager = App.createRequestManager({
    requestTimeout: 10_000,
    interceptor: {
      interceptRequest: async (request: Request) => {
        console.log("INTERCEPTING REQUEST");
        var valueFromState = this.stateManager.retrieve("test");
        if (!valueFromState) return request;

        return request;
      },
    },
  });

  async getBookDetails(id: string): Promise<SourceBook> {
    const request = App.createRequest({
      url: `${this.BASE_URL}${id}`,
      method: "GET",
    });

    const response = await this.requestManager.request(request);
    const data = JSON.parse(
      response.data ?? "{}",
    ) as unknown as ZLibraryBookInfoResponse;

    // NEEDS AUTH
    // const fileRequest = App.createRequest({
    //   url: `${this.BASE_URL}${id}/file`,
    //   method: "GET",
    // });

    // const fileResponse = await this.requestManager.request(fileRequest);

    return App.createSourceBook({
      id: id,
      bookInfo: App.createBookInfo({
        title: data.book.title,
        author: data.book.author,
        image: data.book.cover,
        downloadLinks: [],
        desc: data.book.description,
      }),
    });
  }

  async getHomePageSections(
    sectionCallback: (section: HomeSection) => void,
  ): Promise<void> {
    const request = App.createRequest({
      url: `${this.BASE_URL}/eapi/book/most-popular`,
      method: "GET",
    });

    sectionCallback(
      App.createHomeSection({
        id: "most-popular",
        title: "Most Popular",
        containsMoreItems: false,
      }),
    );

    const response = await this.requestManager.request(request);
    const data = JSON.parse(
      response.data ?? "{}",
    ) as unknown as MostPopularResponse;

    var pbooks: PartialSourceBook[] = [];
    for (let book of data.books) {
      pbooks.push(
        App.createPartialSourceBook({
          id: `/eapi/book/${book.id}/${book.hash}`,
          title: book.title,
          author: book.author,
          image: book.cover,
        }),
      );
    }

    sectionCallback(
      App.createHomeSection({
        id: "most-popular",
        title: "Most Popular",
        containsMoreItems: false,
        items: pbooks,
      }),
    );
  }

  async getSearchResults(
    query: SearchRequest,
    metadata: any,
  ): Promise<PagedResults> {
    const page = metadata?.page ?? 1;
    const limit = 100;

    const request = App.createRequest({
      url: `${this.BASE_URL}/eapi/book/search`,
      method: "POST",
      data: JSON.stringify({
        message: query.title,
        page: page,
        limit: limit,
        extensions: [
          FileExtension.AZW3,
          FileExtension.EPUB,
          FileExtension.FB2,
          FileExtension.MOBI,
          FileExtension.PDF,
        ],
      }),
    });

    const response = await this.requestManager.request(request);
    const data = JSON.parse(response.data ?? "{}") as unknown as SearchResponse;

    var pbooks: PartialSourceBook[] = [];
    for (let book of data.books) {
      pbooks.push(
        App.createPartialSourceBook({
          id: `/eapi/book/${book.id}/${book.hash}`,
          title: book.title,
          author: book.author,
          image: book.cover,
        }),
      );
    }

    return App.createPagedResults({
      results: pbooks,
      metadata: { page: page + 1 },
    });
  }
}
