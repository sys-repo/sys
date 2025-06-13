import { useRef } from 'react';
import { type t, Is, slug } from './common.ts';

type P = t.DocumentIdInputProps;
type H = t.DocumentIdHook;

export const useController: t.UseDocumentIdHook = (input = {}) => {
  /**
   * Hooks:
   */
  const instanceRef = useRef(slug());

  // Exit if an existing hook intance was passed.
  if (Is.record<H>(input) && Is.string(input.instance)) return input;

  /**
   * Setup:
   */
  const args = input as t.UseDocumentIdHookArgs;
  const { repo } = args ?? {};

  // console.log('repo', repo);
  const action: t.DocumentIdInputAction = 'Create'; // TODO 🐷

  /**
   * Handlers:
   */
  const onActionClick: t.DocumentIdInputActionHandler = (e) => {
  };

  const onValueChange: t.TextInputChangeHandler = (e) => {
  };

  /**
   * API:
   */
  return {
    instance: instanceRef.current,
    action,
    handlers: {
      onActionClick,
      onValueChange,
    },
  };
};
