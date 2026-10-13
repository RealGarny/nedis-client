const PARAM_SYMBOL = /\{(\w+)\}/g;

// encodeURIComponent leaves dots alone, and URL resolution then collapses
// "channels/../messages" into "messages": a param value of "." or ".." would
// silently retarget the request to another endpoint of the same server.
// An empty value collapses the path the same way ("channels//messages").
const UNSAFE_SEGMENT = /^\.{0,2}$/;

function fillPath(template: string, params: Readonly<Record<string, string>> | undefined) {
  return template.replace(PARAM_SYMBOL, (_, name: string) => {
    const value = params?.[name];
    if (value === undefined) throw new Error(`Param "${name}" is not set for ${template}."`);
    if (UNSAFE_SEGMENT.test(value)) {
      throw new Error(`Param "${name}" is empty or a dot segment in ${template}`);
    }
    return encodeURIComponent(value);
  });
}

export { fillPath };
