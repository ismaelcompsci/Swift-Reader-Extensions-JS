import axios, { AxiosHeaders } from "axios";
import cheerio from "cheerio";
import { Request, Response, SearchRequest } from "../types";
import { Libgen } from "./libgen";

// test mangger
class RequestManager {
  readonly requestTimeout: number;

  constructor(requestTimeout?: number) {
    this.requestTimeout = requestTimeout ?? 20_000;
  }

  async request(request: Request): Promise<Response> {
    let headers = request.headers;

    const agent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

    let response = await axios(`${request.url}${request.param ?? ""}`, {
      method: request.method,
      headers: {
        ...headers,
        "User-Agent": agent,
      },
      timeout: this.requestTimeout || 0,
      responseType: "arraybuffer",
    });

    let responsePacked: Response = {
      data: Buffer.from(response.data, "binary").toString(),
      status: response.status,
      headers: response.headers,
      request: request,
    };

    return responsePacked;
  }
}
// @ts-ignore
const a = new Libgen(cheerio);
a.requestManager = new RequestManager();

async function start() {
  // let res = await a.getBookDetails("B86EB090DE1BAE4A1AB7FAD818DCC332");
  //
  const q: SearchRequest = {
    title: "The l",
    parameters: {},
    includedTags: [],
  };

  let res = await a.getSearchResults(q, undefined);
}

start();
// @ts-ignore
globalThis.App = new Proxy(
  {},
  {
    get(target, p) {
      // @ts-ignore
      if (target[p]) {
        // @ts-ignore
        return target[p];
      }

      if (typeof p === "string" && p.startsWith("create")) {
        return (anyProps: any) => anyProps;
      }

      return undefined;
    },
  },
);
