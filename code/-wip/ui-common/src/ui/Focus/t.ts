export type FocusHandler = (e: FocusHandlerArgs) => void;
export type FocusHandlerArgs = {
  action: 'focus' | 'blur';
  focus: boolean;
  blur: boolean;
  el?: Element;
};

export type ActiveElementChangedHandler = (e: FocusHandlerArgs) => void;
