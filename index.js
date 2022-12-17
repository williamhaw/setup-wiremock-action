const core = require("@actions/core");
const tc = require("@actions/tool-cache");
const path = require("path");
const fs = require("fs-extra");
const cp = require("child_process");
const process = require("process");
const got = require("got");

const wiremockVersion = "2.35.0";
const wiremockStdOutPath = "out.log";
const wiremockStdOut = fs.createWriteStream(wiremockStdOutPath);
const wiremockArtifactName = `wiremock-jre8-standalone-${wiremockVersion}.jar`;
const wiremockPingMappingFileName = "__wiremock-ping-mapping.json";
const cwd = process.cwd();

const getInputs = () => {
  const mappingsPath = core.getInput("mappings", { required: true });
  const filesPath = core.getInput("mappings", { required: true });
  const testCommandString = core.getInput("command", { required: true });
  const httpPort = core.getInput("http-port")
    ? core.getInput("http-port")
    : "8080";
  const isVerboseLogging = core.getInput("verbose") === "true" ? true : false;

  return {
    mappingsPath: mappingsPath,
    filesPath: filesPath,
    httpPort: httpPort,
    testCommandString: testCommandString,
    isVerboseLogging: isVerboseLogging,
  };
};

const installWiremockFromToolCache = async () => {
  let wiremockPath = tc.find("wiremock", wiremockVersion);
  if (wiremockPath) {
    return { wiremockPath: path.join(wiremockPath, wiremockArtifactName) };
  } else {
    wiremockPath = await tc.downloadTool(
      `https://repo1.maven.org/maven2/com/github/tomakehurst/wiremock-jre8-standalone/${wiremockVersion}/${wiremockArtifactName}`
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
  const pingMapping = path.join(__dirname, wiremockPingMappingFileName);
  fs.emptyDirSync(wiremockMappingsPath);
  fs.emptyDirSync(wiremockFilesPath);
  fs.copySync(inputMappingsPath, wiremockMappingsPath);
  fs.copySync(inputFilesPath, wiremockFilesPath);
  fs.copyFileSync(
    pingMapping,
    path.join(wiremockMappingsPath, wiremockPingMappingFileName)
  );
  return {
    currentWorkingDirectory: cwd,
    wiremockMappingsPath: wiremockMappingsPath,
    wiremockFilesPath: wiremockFilesPath,
  };
};

const startWireMock = (wiremockPath, isVerboseLogging) => {
  const options = {
    cwd: cwd,
    detached: true,
  };
  let args = ["-jar", wiremockPath];
  if (isVerboseLogging) {
    args.push("--verbose");
  }
  const wiremockProcess = cp.spawn("java", args, options);
  wiremockProcess.stdout.on("data", (data) => {
    wiremockStdOut.write(data.toString("utf8"));
  });
  return wiremockProcess;
};

const isWireMockRunning = async (httpPort) => {
  try {
    const retry = {
      retry: {
        limit: 3,
      },
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
const runAPITests = (commandString) => {
  console.log(`Running command: ${commandString}`);
  const testProcess = cp.spawnSync(commandString, {
    stdio: "inherit",
    shell: true,
  });
  return testProcess.status === 0;
};

const shutdownWiremock = async (wiremockProcess) => {
  wiremockProcess.kill();
  await wait(1000); //kill is asynchronous and there is no killSync method. Required to wait for remaining stdout to be produced.
  wiremockStdOut.end();
};

//output Wiremock logging for stub mismatches
const setActionOutput = () => {
  const stdOutput = fs.readFileSync(wiremockStdOutPath, { encoding: "utf8" });
  core.setOutput("wiremock-stdout", stdOutput);
};

const cleanupFiles = (wiremockMappingsPath, wiremockFilesPath) => {
  fs.removeSync(wiremockMappingsPath);
  fs.removeSync(wiremockFilesPath);
};

const wait = (duration, ...args) =>
  new Promise((resolve) => {
    setTimeout(resolve, duration, ...args);
  });

/*
Main logic starts
*/

(async function () {
  try {
    const {
      mappingsPath,
      filesPath,
      httpPort,
      testCommandString,
      isVerboseLogging,
    } = getInputs();

    const wiremockPath = await installWiremockFromToolCache();

    var { wiremockMappingsPath, wiremockFilesPath } = copyStubs(
      mappingsPath,
      filesPath
    );

    var wiremockProcess = startWireMock(wiremockPath, isVerboseLogging);

    var isRunning = await isWireMockRunning(httpPort);

    if (isRunning) {
      console.log("WireMock is up and running");
    } else {
      throw "Wiremock was not running.";
    }

    var isTestRunSucceeded = runAPITests(testCommandString);

    if (isTestRunSucceeded) {
      console.log("API test run succeeded");
    } else {
      throw "API test run failed";
    }
  } catch (error) {
    console.error(error);
    core.setFailed(error.message);
  } finally {
    if (wiremockProcess) {
      await shutdownWiremock(wiremockProcess);
    }
    setActionOutput();
    cleanupFiles(wiremockMappingsPath, wiremockFilesPath);
    if (!(isRunning && isTestRunSucceeded)) {
      core.setFailed("Errors during test setup");
      process.exit(1);
    }
  }
})().catch((error) => {
  core.setFailed(error.message);
  process.exit(1);
});

/*
  Main logic ends
*/
