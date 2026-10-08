type EventListener<Payload> = (payload: Payload) => void;
type Unsubscribe = () => void;

type EventModule<Payload, Name extends string> = {
  [K in `on${Capitalize<Name>}`]: (listener: EventListener<Payload>) => Unsubscribe;
} & {
  [K in `dispatch${Capitalize<Name>}`]: (payload: Payload) => void;
};

export type { EventListener, EventModule, Unsubscribe };
