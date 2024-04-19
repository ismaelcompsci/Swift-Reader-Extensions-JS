import axios from "axios";
import { AnnasArchive } from "./AnnasArchive";
import cheerio from "cheerio";
import { Request, Response } from "../types";

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
      request: request,
    };

    return responsePacked;
  }
}
// @ts-ignore
const a = new AnnasArchive(cheerio);
a.requestManager = new RequestManager();

async function start() {
  let res = await a.getBookDetails("f1671f69c759d32e8bcb240cffe90738");
  console.log(res.bookInfo.downloadLinks);
}

start();
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
