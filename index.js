const core = require("@actions/core");
const tc = require("@actions/tool-cache");
const path = require("path");
const fs = require("fs-extra");
const cp = require("child_process");
const http = require("http");

const wiremockVersion = "2.26.3";
const wiremockStdOutF = fs.openSync("out.log", "a");
const wiremockStdErrF = fs.openSync("err.log", "a");

const inputs = getInputs();

const getInputs = () => {
  const mappingsPath = core.getInput("mappings", { required: true });
  const filesPath = core.getInput("mappings", { required: true });
  const httpPort = core.getInput("http-port")
    ? core.getInput("http-port")
    : "8080";

  return {
    mappingsPath: mappingsPath,
    filesPath: filesPath,
    httpPort: httpPort
  };
};

//install Wiremock jar from toolcache
const installWiremock = async () => {
  let wiremockPath = tc.find("wiremock", wiremockVersion);
  if (wiremockPath) {
    return wiremockPath;
  } else {
    wiremockPath = await tc.downloadTool(
      `https://repo1.maven.org/maven2/com/github/tomakehurst/wiremock-standalone/${wiremockVersion}/wiremock-standalone-${wiremockVersion}.jar`
    );
    const cachedPath = await tc.cacheFile(
      wiremockPath,
      "wiremock",
      wiremockVersion
    );
    return cachedPath;
  }
};

//copy mappings and static files to ${wiremock-path}/mappings and ${wiremock-path}/__files
const copyStubs = (inputMappingsPath, inputFilesPath, wiremockPath) => {
  const wiremockParentPath = path.dirname(wiremockPath);
  const wiremockMappingsPath = path.join(wiremockParentPath, "mappings");
  const wiremockFilesPath = path.join(wiremockParentPath, "__files");
  fs.emptyDirSync(wiremockMappingsPath);
  fs.emptyDirSync(wiremockFilesPath);
  fs.copySync(inputMappingsPath, wiremockMappingsPath);
  fs.copySync(inputFilesPath, wiremockFilesPath);
  return {
    wiremockParentPath: wiremockParentPath,
    wiremockMappingsPath: wiremockMappingsPath,
    wiremockFilesPath: wiremockFilesPath
  };
};

const copyWiremockPingMapping = wiremockMappingsPath => {
  const pingMapping = path.join(__dirname, "__wiremock-ping-mapping.json");
  fs.copyFileSync(pingMapping, wiremockMappingsPath);
};

//start WireMock
const startWireMock = async wiremockPath => {
  //cp.spawn("java", ["-jar", wiremockPath], { detached: true });
  //use spawn
  //write stdout to file
};

//check that Wiremock is running
const isWireMockRunning = http
  .get(`http://localhost:${inputs.httpPort}/__wiremock_ping`, response => {
    const { statusCode } = response;
    return statusCode === 200;
  })
  .on("error", e => {
    throw e;
  });
//run tests from CLI (command to run tests to be given through action parameter)
//shutdown Wiremock
//output Wiremock logging for stub mismatches
