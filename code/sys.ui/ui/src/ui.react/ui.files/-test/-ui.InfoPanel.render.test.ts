import React from 'react';
import { describe, Err, expect, it } from '../../../-test.ts';
import { ErrorMessage } from '../ui.InfoPanel/ui.ErrorMessage.tsx';
import { StatusTitle } from '../ui.InfoPanel/ui.StatusTitle.tsx';

describe('Files.InfoPanel render helpers', () => {
  describe('ErrorMessage', () => {
    it('renders a native title tooltip with the complete error string', () => {
      const error = Err.std('Sample tooltip error', {
        name: 'FilesClientError',
        cause: 'Socket closed',
      });
      const element = ErrorMessage({ value: error });

      expect(React.isValidElement<{ title?: string; children?: React.ReactNode }>(element)).to.eql(
        true,
      );
      if (!React.isValidElement<{ title?: string; children?: React.ReactNode }>(element)) return;

      const children = React.Children.toArray(element.props.children);
      const name = children[0];
      const message = children[1];

      expect(element.type).to.equal('div');
      expect(React.isValidElement<{ children?: string }>(name)).to.eql(true);
      expect(React.isValidElement<{ children?: string }>(message)).to.eql(true);
      if (!React.isValidElement<{ children?: string }>(name)) return;
      if (!React.isValidElement<{ children?: string }>(message)) return;

      expect(name.props.children).to.eql('FilesClientError:');
      expect(message.props.children).to.eql(' Sample tooltip error');
      expect(element.props.title).to.eql(Err.summary(error, { cause: true, stack: true }));
      expect(element.props.title).to.contain('Cause: Error: Socket closed');
    });
  });

  describe('StatusTitle', () => {
    it('hides only the error label', () => {
      const error = StatusTitle({ status: 'error' });
      const ready = StatusTitle({ status: 'ready' });

      expect(React.isValidElement<{ children?: React.ReactNode }>(error)).to.eql(true);
      expect(React.isValidElement<{ children?: React.ReactNode }>(ready)).to.eql(true);
      if (!React.isValidElement<{ children?: React.ReactNode }>(error)) return;
      if (!React.isValidElement<{ children?: React.ReactNode }>(ready)) return;

      const errorChildren = React.Children.toArray(error.props.children);
      const readyChildren = React.Children.toArray(ready.props.children);
      const readyLabel = readyChildren[0];

      expect(errorChildren.length).to.eql(1);
      expect(readyChildren.length).to.eql(2);
      expect(React.isValidElement<{ children?: string }>(readyLabel)).to.eql(true);
      if (!React.isValidElement<{ children?: string }>(readyLabel)) return;
      expect(readyLabel.props.children).to.eql('ready');
    });
  });
});
