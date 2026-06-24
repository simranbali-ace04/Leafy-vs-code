// extension.test.js — basic smoke tests for the Leafy extension.
// Uses Mocha (via VS Code's test runner).

const assert = require('assert');

// You can import vscode and test your extension's API here later.
const vscode = require('vscode');

suite('Extension Test Suite', () => {
  // Let the user know tests have started (shows in VS Code's output).
  vscode.window.showInformationMessage('Start all tests.');

  // A simple sanity check to make sure the test runner itself works.
  test('Sample test', () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });
});
