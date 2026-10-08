import test from 'node:test'
import assert from 'node:assert/strict'
import { detailsError, accessError } from '../src/authValidation.js'

test('signup requires both a name and department', () => {
  assert.ok(detailsError('  ', 'CSE'))
  assert.ok(detailsError('Campus Member', ''))
  assert.equal(detailsError(' Campus Member ', 'CSE'), '')
})
test('signup rejects malformed email and short passwords', () => {
  assert.ok(accessError('invalid', 'example-password', 'example-password'))
  assert.ok(accessError('member@example.com', 'short', 'short'))
})
test('signup requires matching confirmation and accepts valid access details', () => {
  assert.equal(accessError('member@example.com', 'example-password', 'different'), 'Your passwords do not match.')
  assert.equal(accessError(' member@example.com ', 'example-password', 'example-password'), '')
})
