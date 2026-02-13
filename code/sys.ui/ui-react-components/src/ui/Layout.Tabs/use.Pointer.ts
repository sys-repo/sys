import React from 'react';

type UseTabPointerArgs = {
  selected: boolean;
  onActivate: () => void;
};

type UseTabPointer = (args: UseTabPointerArgs) => {
  readonly isOver: boolean;
  readonly isDown: boolean;
  readonly handlers: {
    onPointerEnter: React.PointerEventHandler;
    onPointerLeave: React.PointerEventHandler;
    onPointerDown: React.PointerEventHandler;
    onPointerUp: React.PointerEventHandler;
    onPointerCancel: React.PointerEventHandler;
    onTouchStart: React.TouchEventHandler;
    onTouchEnd: React.TouchEventHandler;
    onTouchCancel: React.TouchEventHandler;
  };
};

export const useTabPointer: UseTabPointer = (args) => {
  const { selected, onActivate } = args;
  const [isOver, setOver] = React.useState(false);
  const [isDown, setDown] = React.useState(false);
  const downRef = React.useRef(false);

  const setDownState = (value: boolean) => {
    downRef.current = value;
    setDown(value);
  };

  const activate = () => {
    if (selected || !downRef.current) return;
    setDownState(false);
    onActivate();
  };

  const handlers: {
    onPointerEnter: React.PointerEventHandler;
    onPointerLeave: React.PointerEventHandler;
    onPointerDown: React.PointerEventHandler;
    onPointerUp: React.PointerEventHandler;
    onPointerCancel: React.PointerEventHandler;
    onTouchStart: React.TouchEventHandler;
    onTouchEnd: React.TouchEventHandler;
    onTouchCancel: React.TouchEventHandler;
  } = {
    onPointerEnter: () => setOver(true),
    onPointerLeave: () => {
      setOver(false);
      setDownState(false);
    },
    onPointerDown: () => {
      if (selected) return;
      setDownState(true);
    },
    onPointerUp: () => activate(),
    onPointerCancel: () => setDownState(false),
    onTouchStart: () => {
      setOver(true);
      if (selected) return;
      setDownState(true);
    },
    onTouchEnd: () => {
      activate();
      setOver(false);
    },
    onTouchCancel: () => {
      setDownState(false);
      setOver(false);
    },
  };

  return { isOver, isDown, handlers } as const;
};
