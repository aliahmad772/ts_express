# Typed Express API

A small TypeScript Express app demonstrating typed route parameters, query
strings, request bodies, response payloads, and middleware.

## Run

```sh
npm install
npm run build
npm start
```

The server listens on port `3000` by default. Set `PORT` to use another port.

## Try it

```sh
curl http://localhost:3000/api/users
curl "http://localhost:3000/api/users/1?includeEmail=false"
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Katherine Johnson\",\"email\":\"katherine@example.com\"}"
```

Every response includes a request ID in its JSON payload, and the request ID
middleware also returns it in the `X-Request-Id` header.
