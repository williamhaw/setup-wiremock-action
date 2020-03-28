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

### `http-port`

Port on which to run Wiremock. Defaults to 8080.


## Outputs

### `wiremock-stdout`

Logs from Wiremock. If any stubs are not matched, they will be reported here.

### `wiremock-stderr`

Errors from running Wiremock. If the commmand to run Wiremock fails, it will be reported here.

## Example usage

### Basic usage
```
- uses: actions/setup-java@v1
    with:
        java-version: '11'
- uses: actions/setup-wiremock-action@v0.1.0
    with:
        mappings: 'wiremock-mappings'
        files: 'wiremock-files'
```