const core = require("@actions/core");
const tc = require("@actions/tool-cache");

const inputs = getInputs();
const wiremockVersion = "2.26.3";

const getInputs = () => {
  try {
    const mappingsPath = core.getInput("mappings", { required: true });
    const filesPath = core.getInput("mappings", { required: true });
    const httpPort = core.getInput("http-port");

    return {
      mappingsPath: mappingsPath,
      filesPath: filesPath,
      httpPort: httpPort
    };
  } catch (error) {
    core.setFailed(error.message);
  }
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
    core.addPath(cachedPath);
    return wiremockPath;
  }
};

//copy mappings and static files to ${wiremock-path}/mappings and ${wiremock-path}/__files
//start WireMock
//run tests from CLI (command to run tests to be given through action parameter)
//shutdown Wiremock
//output Wiremock logging for stub mismatches
