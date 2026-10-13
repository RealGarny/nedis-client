import type { Origin } from "@/shared/lib/communityServer/origin";

class NeedLoginError extends Error {
  readonly origin: Origin;

  constructor(origin: Origin, message = "Login is needed") {
    super(message);
    this.name = "NeedLoginError";
    this.origin = origin;
  }
}

export { NeedLoginError };
