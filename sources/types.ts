export interface SourceInterceptor {
  interceptRequest(request: Request): Promise<Request>;
}

export interface DownloadInfo {
  link: string;
  filetype: string;
}

export interface SourceInfo {
  readonly name: string;
  readonly description: string;
  readonly websiteURL: string;
}

export interface RequestManager {
  readonly requestTimeout: number;
  readonly interceptor?: SourceInterceptor;

  request(request: Request): Promise<Response>;
}

export interface PagedResults {
  results: PartialSourceBook[];
  metadata?: any;
}

export interface PartialSourceBook {
  id: string;
  title: string;
  image?: string;
  author?: string;
}

export interface Tag {
  readonly id: string;
  readonly label: string;
}

export interface SearchRequest {
  readonly title?: string;
  readonly includedTags: Tag[];
  readonly parameters: Record<string, any>;
}

export interface BookInfo {
  title: string;
  author?: string;
  desc?: string;
  image?: string;
  tags?: string[];
  downloadLinks: DownloadInfo[];
}

export interface SourceBook {
  id: string;
  bookInfo: BookInfo;
}

export interface Response {
  readonly data?: string;
  // rawData?: RawData;
  readonly status: number;
  readonly headers: Record<any, any>;
  readonly request: Request;
}

export interface Request {
  url: string;
  method: string;
  headers: Record<string, string>;
  data?: any;
  param?: string;
  cookies: Cookie[];
}

export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path?: string;
  created?: Date;
  expires?: Date;
}

export interface HomeSection {
  readonly id: string;
  readonly title: string;
  items: PartialSourceBook[];
  containsMoreItems: boolean;
}
export interface SecureStateManager {
  store(key: string, value: any): Promise<void>;
  retrieve(key: string): Promise<any>;
}

export interface SourceStateManager {
  readonly keychain: SecureStateManager;

  store(key: string, value: any): Promise<void>;
  retrieve(key: string): Promise<any>;
}

declare global {
  namespace App {
    function createSourceStateManager(): SourceStateManager;
  }
}

declare global {
  namespace App {
    function createHomeSection(info: {
      id: string;
      title: string;
      // type: string;
      items?: PartialSourceBook[];
      containsMoreItems: boolean;
    }): HomeSection;
  }
}

declare global {
  namespace App {
    function createSourceBook(info: {
      id: String;
      bookInfo: BookInfo;
    }): SourceBook;
  }
}

declare global {
  namespace App {
    function createDownloadInfo(info: {
      link: string;
      filetype: string;
    }): DownloadInfo;
  }
}

declare global {
  namespace App {
    function createRequestManager(info: {
      requestTimeout?: number;
      interceptor?: SourceInterceptor;
    }): RequestManager;
  }
}

declare global {
  namespace App {
    function createBookInfo(info: {
      title: string;
      author?: string;
      desc?: string;
      image?: string;
      tags?: string[];
      downloadLinks: DownloadInfo[];
    }): BookInfo;
  }
}

declare global {
  namespace App {
    function createRequest(info: {
      url: string;
      method: string;
      headers?: Record<string, string>;
      param?: string;
      data?: any;
      cookies?: Cookie[];
    }): Request;
  }
}

declare global {
  namespace App {
    function createPagedResults(info: {
      results?: PartialSourceBook[];
      metadata?: any;
    }): PagedResults;
  }
}

declare global {
  namespace App {
    function createPartialSourceBook(info: {
      id: string;
      image?: string;
      title: string;
      author?: string;
    }): PartialSourceBook;
  }
}
