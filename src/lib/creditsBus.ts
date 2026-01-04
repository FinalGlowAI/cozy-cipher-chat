type CreditsChangeHandler = () => void;

const target = new EventTarget();
const EVENT = "credits:changed";

export const emitCreditsChanged = () => {
  target.dispatchEvent(new Event(EVENT));
};

export const onCreditsChanged = (handler: CreditsChangeHandler) => {
  target.addEventListener(EVENT, handler);
  return () => target.removeEventListener(EVENT, handler);
};
