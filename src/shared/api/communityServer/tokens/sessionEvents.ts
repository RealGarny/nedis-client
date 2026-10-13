import type { Origin } from "@/shared/lib/communityServer";
import { createEvent } from "@/shared/lib/event";

function createSessionLostEvent() {
  return createEvent<Origin, "sessionLost">("sessionLost");
}

export { createSessionLostEvent };
