import axios from "axios";
import { GoodReads } from "./GoodReads";
import cheerio from "cheerio";
import { HomeSection, Request, Response } from "../types";

// test mangger
class RequestManager {
  readonly requestTimeout: number;

  constructor(requestTimeout?: number) {
    this.requestTimeout = requestTimeout ?? 20_000;
  }

  async request(request: Request): Promise<Response> {
    let headers = request.headers;

    let response = await axios(`${request.url}${request.param ?? ""}`, {
      method: request.method,
      headers: headers,
      timeout: this.requestTimeout || 0,
      responseType: "arraybuffer",
    });

    let responsePacked: Response = {
      data: Buffer.from(response.data, "binary").toString(),
      status: response.status,
      headers: response.headers,
      request: response.request,
    };

    return responsePacked;
  }
}

// @ts-ignore
const api = new GoodReads(cheerio);
api.requestManager = new RequestManager();

const callback = (e: HomeSection) => {
  console.log(e);
};

async function t() {
  await api.getHomePageSections(callback);
  // await api.getViewMoreItems("/list/show/3810.Best_Cozy_Mystery_Series", {});
}

t();

// delete before build
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
