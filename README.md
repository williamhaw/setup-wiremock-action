# setup-wiremock-action

Sets up a [Wiremock](http://wiremock.org/) API using the provided stubs.

Requirements: Java (preferably Java 11)

## Inputs

### `mappings`

**Required** Path to folder with JSON stubs.

References:
  -  http://wiremock.org/docs/running-standalone/#json-file-configuration

### `files`

**Required** Path to folder with static files. Use these files in the mappings to fill out the response body.

References:
  - http://wiremock.org/docs/stubbing/#specifying-the-response-body

### `command`

**Required** Command to run tests

Note: Only verbose flags are currently supported. (Flags that start with `--`)

Example: `'npm test --testNamePattern=MyApiTests'`

### `http-port`

Port on which to run Wiremock. Defaults to 8080.


## Outputs

### `wiremock-stdout`

Logs from Wiremock. If any stubs are not matched, they will be reported here.

## Example usage

### Basic usage
```
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    name: Set up WireMock as a standalone process
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Setup Java
        uses: actions/setup-java@v1
        with:
          java-version: '11'
      - name: Action E2E Test
        uses: ./
        id: setup-wiremock
        with:
          mappings: 'example-mapping-directory'
          files: 'example-files-directory'
        continue-on-error: true
      - name: Get the WireMock standard output
        run: echo "${{ steps.setup-wiremock.outputs.wiremock-stdout }}"
```