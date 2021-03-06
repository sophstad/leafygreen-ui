import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { typeIs } from '@leafygreen-ui/lib';
import Code from './Code';

const codeSnippet = 'const greeting = "Hello, world!";';
const className = 'test-class';
const onCopy = jest.fn();

describe('packages/Syntax', () => {
  describe('when multiline is true', () => {
    const { container } = render(
      <Code className={className} language="javascript">
        {codeSnippet}
      </Code>,
    );

    const codeContainer = (container.firstChild as HTMLElement).lastChild;
    const codeRoot = (codeContainer as HTMLElement).firstChild;
    const copyButton = codeRoot?.nextSibling?.firstChild as HTMLElement;

    if (!codeRoot || !typeIs.element(codeRoot)) {
      throw new Error('Multiline code element not found');
    }

    if (!copyButton || !typeIs.element(copyButton)) {
      throw new Error('Multiline copy button not found');
    }

    test('root element renders as a <pre> tag', () => {
      expect(codeRoot.tagName).toBe('PRE');
    });

    test(`renders "${className}" in the root element's classList`, () => {
      expect(codeRoot.classList.contains(className)).toBe(true);
    });
  });

  describe('when multiline is false', () => {
    const {
      container: { firstChild: containerRoot },
    } = render(
      <Code className={className} multiline={false} language="javascript">
        {codeSnippet}
      </Code>,
    );

    const codeContainer = (containerRoot as HTMLElement).lastChild;
    const codeRoot = (codeContainer as HTMLElement).firstChild;
    const copyRoot = (codeContainer as HTMLElement).lastChild;

    if (!codeRoot || !typeIs.element(codeRoot)) {
      throw new Error('Single line code element not found');
    }

    if (!copyRoot || !typeIs.element(copyRoot)) {
      throw new Error('Single line copy button not found');
    }

    test('code wrapper element renders as a <div> tag', () => {
      expect(codeRoot.tagName).toBe('DIV');
    });

    test(`renders "${className}" in the root element's classList`, () => {
      expect(codeRoot.classList.contains(className)).toBe(true);
    });
  });

  describe('when copyable is true', () => {
    test('onCopy callback is fired when code is copied', () => {
      render(
        <Code onCopy={onCopy} copyable={true} language="javascript">
          {codeSnippet}
        </Code>,
      );
      const copyIcon = screen.getByRole('button');
      fireEvent.click(copyIcon);
      expect(onCopy).toBeCalledTimes(1);
    });
  });
});
