import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { DecoratorNode } from 'lexical';
import React from 'react';
import { CheckboxItem } from './CheckboxItem';

export type SerializedCheckboxNode = Spread<
  {
    checked: boolean;
    text: string;
  },
  SerializedLexicalNode
>;

export class CheckboxNode extends DecoratorNode<React.JSX.Element> {
  __checked: boolean;
  __text: string;

  static getType(): string {
    return 'checkbox';
  }

  static clone(node: CheckboxNode): CheckboxNode {
    return new CheckboxNode(node.__checked, node.__text, node.__key);
  }

  constructor(checked: boolean, text: string, key?: NodeKey) {
    super(key);
    this.__checked = checked;
    this.__text = text;
  }

  createDOM(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'checkbox-container flex items-start gap-2 my-1';
    element.setAttribute('data-checkbox-key', this.__key);
    return element;
  }

  updateDOM(): false {
    return false;
  }

  setChecked(checked: boolean): void {
    const writable = this.getWritable();
    writable.__checked = checked;
  }

  getChecked(): boolean {
    return this.__checked;
  }

  setText(text: string): void {
    const writable = this.getWritable();
    writable.__text = text;
  }

  getText(): string {
    return this.__text;
  }

  decorate(): React.JSX.Element {
    return (
      <CheckboxItem
        nodeKey={this.__key}
        checked={this.__checked}
        text={this.__text}
      />
    );
  }

  exportJSON(): SerializedCheckboxNode {
    return {
      checked: this.__checked,
      text: this.__text,
      type: 'checkbox',
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedCheckboxNode): CheckboxNode {
    return new CheckboxNode(serializedNode.checked, serializedNode.text);
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-checkbox', 'true');
    element.setAttribute('data-checked', String(this.__checked));
    element.textContent = this.__text;
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-checkbox')) {
          return null;
        }
        return {
          conversion: convertCheckboxElement,
          priority: 1,
        };
      },
    };
  }

  isInline(): false {
    return false;
  }
}

function convertCheckboxElement(domNode: HTMLElement): DOMConversionOutput | null {
  const checked = domNode.getAttribute('data-checked') === 'true';
  const text = domNode.textContent || '';
  const node = new CheckboxNode(checked, text);
  return { node };
}