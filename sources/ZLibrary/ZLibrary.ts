import { CheerioAPI } from "cheerio/lib/load";
import {
  HomeSection,
  PagedResults,
  PartialSourceBook,
  SearchRequest,
  SourceBook,
  Request,
  SourceStateManager,
  RequestManager,
} from "../types";
import {
  DownloadInfoResponse,
  LoginResponse,
  MostPopularResponse,
  SearchResponse,
  ZLibraryBookInfoResponse,
} from "./ZTypes";
import { UISection } from "../uitypes";
import { accountSettings, getAccessToken } from "./Setttings";

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
        const accountTokens = await getAccessToken(this.stateManager);

        if (!accountTokens) {
          return request;
        }

        request.headers = {
          ...request.headers,
          Cookies: `remix_userid=${accountTokens.remixUserid};remix_userkey=${accountTokens.remixUserkey}`,
        };

        return request;
      },
    },
  });

  async getSourceMenu(): Promise<UISection> {
    return App.createUISection({
      id: "source_settings",
      isHidden: false,
      title: "Source Settings",
      rows: async () => [
        ...(await accountSettings(this.requestManager, this.stateManager)),
      ],
    });
  }

  async getBookDetails(id: string): Promise<SourceBook> {
    const request = App.createRequest({
      url: `${this.BASE_URL}${id}`,
      method: "GET",
    });

    const response = await this.requestManager.request(request);
    const data: ZLibraryBookInfoResponse =
      typeof response.data === "string"
        ? JSON.parse(response.data)
        : response.data;

    // NEEDS AUTH
    const fileRequest = App.createRequest({
      url: `${this.BASE_URL}${id}/file`,
      method: "GET",
    });

    const fileResponse = await this.requestManager.request(fileRequest);
    const fileInfo: DownloadInfoResponse =
      typeof fileResponse.data === "string"
        ? JSON.parse(fileResponse.data)
        : fileResponse.data;

    const downloadLink = App.createDownloadInfo({
      link: fileInfo.file.downloadLink,
      filetype: fileInfo.file.extension,
    });

    return App.createSourceBook({
      id: id,
      bookInfo: App.createBookInfo({
        title: data.book.title,
        author: data.book.author,
        image: data.book.cover,
        downloadLinks: [downloadLink],
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
