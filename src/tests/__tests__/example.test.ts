import { describe, expect, test } from '@jest/globals';
import Quill from 'quill';
import { setupQuillEditor } from '../setup';
import { queryByRole } from '@testing-library/dom';

describe('Quill Table Better Demo', () => {
  test('should render the Quill editor', () => {
    const quill = setupQuillEditor();
    expect(quill).toBeInstanceOf(Quill);
    expect(document.getElementById('editor')).not.toBeNull();
  });

  test('should render the Quill toolbar', () => {
    const quill = setupQuillEditor();
    expect(quill).toBeInstanceOf(Quill);
    const toolbar = queryByRole(document.body, 'toolbar');
    expect(toolbar).not.toBeNull();
  });
});