async function readBody(response: Response) {
  const text = await response.text();
  if (text === "") return undefined;

  const contentType = response.headers.get("Content-type") ?? "";
  if (!contentType.includes("json")) return text;

  return JSON.parse(text);
}

export { readBody };
