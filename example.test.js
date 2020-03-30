const got = require("got");
const fs = require("fs-extra");
const assert = require("assert").strict;

(async function () {
  const responseOne = await got(`http://localhost:8080/one`);
  assert.strictEqual(responseOne.statusCode, 200);
  assert.strictEqual(responseOne.body, "one\n");

  const responseTwo = await got(`http://localhost:8080/two`);
  assert.strictEqual(responseTwo.statusCode, 200);
  assert.strictEqual(responseTwo.body, '{"statuses":[1,2,3]}');

  const responseThree = await got(`http://localhost:8080/three`);
  const expectedResponseString = fs
    .readFileSync("example-files-directory/example-file.json")
    .toString();
  assert.strictEqual(responseThree.statusCode, 200);
  assert.strictEqual(
    JSON.stringify(JSON.parse(responseThree.body)), //compare values
    JSON.stringify(JSON.parse(expectedResponseString))
  );
})().catch(error => console.error(error));
