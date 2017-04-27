# api-auth

The data. Given an auth token, act on behalf of the logged-in user, or on behalf of a stranger. Get data & modify data.

Talks to the auth service to turn a cookie token into an auth token. Is consumed by the www service & the in-browser application, as well as external clients. Must therefore do the following:

- rate-limit all requests
- tarpit potentially abusive requests (e.g., login attempts from a given IP)
- the usual sanitization of input data
- log data mutations

Speaks only json.

## operational requirements

- does not terminate TLS itself, so must run behind termination such as nginx or haproxy
- postgres, redis, probably s3? or at least flat files
- talks to the auth service to turn cookies into auth tokens

## configuration

- access to all of the above
