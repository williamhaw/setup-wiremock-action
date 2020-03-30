const got = require("got");
const fs = require("fs-extra");
const assert = require("assert").strict;

(async function () {
  const response = await got(`http://localhost:${httpPort}/one`);
  assert.strictEqual(response.statusCode, 200);
  assert.strictEqual(response.body, "one\n");

  const response = await got(`http://localhost:${httpPort}/two`);
  assert.strictEqual(response.statusCode, 200);
  assert.strictEqual(response.body, '{"statuses":[1,2,3]}');

  const response = await got(`http://localhost:${httpPort}/three`);

  const expectedResponseString = fs
    .readFileSync("example-files-directory/example-file.json")
    .toString();
  assert.strictEqual(response.statusCode, 200);
  assert.strictEqual(
    JSON.parse(response.body),
    JSON.parse(expectedResponseString)
  );
})();
