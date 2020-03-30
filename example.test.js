const got = require("got");
const fs = require("fs-extra");
const assert = require("assert").strict;

(async function () {
  console.log("Starting first test case...");
  const responseOne = await got(`http://localhost:8080/one`);
  assert.strictEqual(responseOne.statusCode, 200);
  assert.strictEqual(responseOne.body, "one\n");
  console.log("Test case succeeded!");

  console.log("Starting second test case...");
  const responseTwo = await got(`http://localhost:8080/two`);
  assert.strictEqual(responseTwo.statusCode, 200);
  assert.strictEqual(responseTwo.body, '{"statuses":[1,2,3]}');
  console.log("Test case succeeded!");

  console.log("Starting third test case...");
  const responseThree = await got(`http://localhost:8080/three`);
  const expectedResponseString = fs
    .readFileSync("example-files-directory/example-file.json")
    .toString();
  assert.strictEqual(responseThree.statusCode, 200);
  assert.strictEqual(
    JSON.stringify(JSON.parse(responseThree.body)), //compare values
    JSON.stringify(JSON.parse(expectedResponseString))
  );
  console.log("Test case succeeded!");
})().catch(error => console.error(error));
