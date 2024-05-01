export interface MostPopularResponse {
  success: number;
  books: ZLibraryBook[];
}

export interface SearchResponse {
  success: number;
  books: ZLibraryBook[];
}

export interface ZLibraryBook {
  id: number;
  title: string;
  author: string;
  cover: string;
  hash: string;
}

export interface ZLibraryBookInfoResponse {
  success: number;
  book: ZLibraryBook;
}

export interface ZLibraryBook {
  id: number;
  title: string;
  author: string;
  volume: string;
  year: number;
  edition: null;
  publisher: string;
  identifier: string;
  language: string;
  pages: number;
  series: string;
  cover: string;
  terms_hash: string;
  active: number;
  deleted: number;
  filesize: number;
  filesizeString: string;
  extension: string;
  md5: string;
  sha256: string;
  href: string;
  hash: string;
  kindleAvailable: boolean;
  sendToEmailAvailable: boolean;
  interestScore: string;
  qualityScore: string;
  description: string;
  dl: string;
  preview: string;
  readOnlineUrl: string;
  _isUserSavedBook: boolean;
  readOnlineAvailable: boolean;
}
