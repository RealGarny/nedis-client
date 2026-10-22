//it is kinda bad to change the Content-Type header value this way, but it will do now.

function resolveContentType(body: unknown, headers: Headers) {
  if (!body || headers.has("Content-Type")) return;

  //Content-type: text/plain is the default, so no need to check for a string type
  switch (typeof body) {
    case "object":
      headers.set("Content-type", "application/json");
  }
}

export { resolveContentType };
