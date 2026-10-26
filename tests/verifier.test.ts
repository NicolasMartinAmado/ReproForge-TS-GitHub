import test from 'node:test';
import assert from 'node:assert/strict';
import { golden, alternative, mutantOverbook, mutantDuplicate, initialState } from '../src/domain.ts';
import { verify } from '../src/verifier.ts';

test('golden reference passes reproducible verification', () => {
  const result=verify(golden); assert.equal(result.passed,true,result.failures[0]);
});
test('alternative correct implementation is accepted', () => {
  const result=verify(alternative); assert.equal(result.passed,true,result.failures[0]);
});
test('overbooking mutation is rejected', () => {
  const result=verify(mutantOverbook); assert.equal(result.passed,false);
  assert.ok(result.failures.length>0);
});
test('missing idempotency mutation is rejected', () => {
  const result=verify(mutantDuplicate); assert.equal(result.passed,false);
});
test('seeded generators are reproducible', () => {
  assert.deepEqual(verify(golden,123,12),verify(golden,123,12));
});
test('invalid capacity is rejected at boundary', () => {
  assert.throws(()=>initialState({resource:-1}),/Invalid capacity/);
});
test('accepted reservation does not mutate input state', () => {
  const state=initialState({hall:3});
  const original=JSON.stringify(state);
  const result=golden(state,{requestId:'test',resourceId:'hall',seats:1});
  assert.equal(result.outcome.status,'accepted');
  assert.equal(JSON.stringify(state),original);
});
