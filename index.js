const core = require("@actions/core");
const tc = require("@actions/tool-cache");
const path = require("path");
const fs = require("fs-extra");
const cp = require("child_process");
const process = require("process");
const got = require("got");

const wiremockVersion = "2.26.3";
const wiremockStdOutPath = "out.log";
const wiremockStdErrPath = "err.log";
const wiremockStdOut = fs.createWriteStream(wiremockStdOutPath);
const wiremockStdErr = fs.createWriteStream(wiremockStdErrPath);
const wiremockArtifactName = `wiremock-standalone-${wiremockVersion}.jar`;
const wiremockPingMappingFileName = "__wiremock-ping-mapping.json";
const cwd = process.cwd();

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

const installWiremockFromToolCache = async () => {
  let wiremockPath = tc.find("wiremock", wiremockVersion);
  if (wiremockPath) {
    return { wiremockPath: path.join(wiremockPath, wiremockArtifactName) };
  } else {
    wiremockPath = await tc.downloadTool(
      `https://repo1.maven.org/maven2/com/github/tomakehurst/wiremock-standalone/${wiremockVersion}/${wiremockArtifactName}`
    );
    const cachedPath = await tc.cacheFile(
      wiremockPath,
      `wiremock-standalone-${wiremockVersion}.jar`,
      "wiremock",
      wiremockVersion
    );
    return path.join(cachedPath, wiremockArtifactName);
  }
};

const copyStubs = (inputMappingsPath, inputFilesPath) => {
  // we are going to start Wiremock in the current working directory, not in Wiremock's directory
  const wiremockMappingsPath = path.join(cwd, "mappings");
  const wiremockFilesPath = path.join(cwd, "__files");
  fs.emptyDirSync(wiremockMappingsPath);
  fs.emptyDirSync(wiremockFilesPath);
  fs.copySync(inputMappingsPath, wiremockMappingsPath);
  fs.copySync(inputFilesPath, wiremockFilesPath);
  return {
    currentWorkingDirectory: cwd,
    wiremockMappingsPath: wiremockMappingsPath,
    wiremockFilesPath: wiremockFilesPath
  };
};

const copyWiremockPingMapping = wiremockMappingsPath => {
  const pingMapping = path.join(__dirname, wiremockPingMappingFileName);
  fs.copyFileSync(
    pingMapping,
    path.join(wiremockMappingsPath, wiremockPingMappingFileName)
  );
};

const startWireMock = wiremockPath => {
  const options = {
    cwd: cwd,
    detached: true
  };
  const wiremockProcess = cp.spawn(
    "java",
    ["-jar", wiremockPath, "--verbose"],
    options
  );
  wiremockProcess.stdout.on("data", data => {
    wiremockStdOut.write(data);
  });
  wiremockProcess.stderr.on("data", data => {
    wiremockStdErr.write(data);
  });
  return wiremockProcess;
};

const isWireMockRunning = async httpPort => {
  try {
    const retry = {
      retry: {
        limit: 3
      }
    };
    const response = await got(
      `http://localhost:${httpPort}/__wiremock_ping`,
      retry
    );
    return response.statusCode === 200;
  } catch (e) {
    throw e; // rethrow on got errors like ECONNREFUSED so that main error handling can catch this error.
  }
};

//run tests from CLI (command to run tests to be given through action parameter)

//shutdown Wiremock
const shutdownWiremock = wiremockProcess => {
  wiremockProcess.kill();
  wiremockStdOut.end();
  wiremockStdErr.end();
};

//output Wiremock logging for stub mismatches
const setActionOutput = () => {
  const stdOutput = fs.readFileSync(wiremockStdOutPath, { encoding: "utf8" });
  core.setOutput("wiremock-stdout", stdOutput);
  const stdError = fs.readFileSync(wiremockStdErrPath, { encoding: "utf8" });
  core.setOutput("wiremock-stdout", stdError);
};

const wait = (duration, ...args) =>
  new Promise(resolve => {
    setTimeout(resolve, duration, ...args);
  });

/*
Main logic starts
*/

(async function () {
  try {
    const { mappingsPath, filesPath, httpPort } = getInputs();

    const wiremockPath = await installWiremockFromToolCache();

    const { wiremockMappingsPath } = copyStubs(mappingsPath, filesPath);

    copyWiremockPingMapping(wiremockMappingsPath);

    var wiremockProcess = startWireMock(wiremockPath);

    const isRunning = await isWireMockRunning(httpPort);

    if (!isRunning) {
      core.setFailed("Wiremock was not running.");
    }
  } catch (error) {
    console.error(error);
    core.setFailed(error.message);
  } finally {
    if (wiremockProcess) {
      shutdownWiremock(wiremockProcess);
    }
    setActionOutput();
    await wait(1000);
  }
})();

/*
  Main logic ends
*/
