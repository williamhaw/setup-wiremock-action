# setup-wiremock-action


## Inputs

### `mappings`

**Required** Path to folder with JSON stubs (as described in http://wiremock.org/docs/running-standalone/#json-file-configuration).

### `files`

**Required** Path to folder with static files (as described in http://wiremock.org/docs/running-standalone/#json-file-configuration).

### `http-port`

Port on which to run Wiremock. Defaults to 8080.


## Outputs

### `wiremock-log`

Logs from Wiremock. If any stubs are not matched, they will be reported here.


## Example usage

uses: actions/setup-wiremock-action@v0.1.0
with:
    mappings: 'wiremock-mappings'
    files: 'wiremock-files'
    http-port: '8888'