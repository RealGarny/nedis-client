import type { EventListener, EventModule, Unsubscribe } from "./types";

function createEvent<Payload, Name extends string>(name: Name): EventModule<Payload, Name> {
  const listeners = new Set<EventListener<Payload>>();

  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);

  const onMethodName = `on${capitalized}`;
  const dispatchMethodName = `dispatch${capitalized}`;

  const onMethod = (listener: EventListener<Payload>): Unsubscribe => {
    const targetListener = listeners.has(listener)
      ? (payload: Payload) => listener(payload)
      : listener;

    listeners.add(targetListener);

    return () => {
      listeners.delete(targetListener);
    };
  };

  const dispatchMethod = (payload: Payload): void => {
    for (const listener of listeners) {
      listener(payload);
    }
  };

  return {
    [onMethodName]: onMethod,
    [dispatchMethodName]: dispatchMethod,
  } as unknown as EventModule<Payload, Name>;
}

export { createEvent };
