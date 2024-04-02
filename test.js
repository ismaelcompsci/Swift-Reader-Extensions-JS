const libgen = require("libgen");

(async () => {
  const options = {
    mirror: "http://libgen.is",
    query: "Assassin's Quest",
    count: 5,
  };

  const data = await libgen.search(options);

  let n = data.length;
  console.log("top " + n + ' results for "' + options.query + '"');
  while (n--) {
    console.log("***********");
    console.log("Title: " + data[n].title);
    console.log("Author: " + data[n].author);
    console.log(
      "Download: " +
        "http://gen.lib.rus.ec/book/index.php?md5=" +
        data[n].md5.toLowerCase(),
    );
  }
})();
