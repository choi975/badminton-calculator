"use strict";

const assert = require("node:assert/strict");
const { calculate, GENDER_GAP } = require("../designs/badminton-calculator/calculator.js");

function closeTo(actual, expected, epsilon = 1e-9) {
  assert.ok(Math.abs(actual - expected) < epsilon, `${actual} should be close to ${expected}`);
}

{
  const result = calculate({
    maleCount: 3,
    femaleCount: 3,
    courtDuration: 3,
    ball1Price: 100,
    ball1Count: 1,
    ball2Price: 30,
    ball2Count: 1,
  });

  assert.equal(result.status, "ready");
  assert.equal(result.distribution, "mixed");
  closeTo(result.courtFee, 70);
  closeTo(result.ballFee, 130);
  closeTo(result.total, 200);
  closeTo(result.maleShare, 35.083333333333336);
  closeTo(result.femaleShare, 31.583333333333336);
  closeTo(result.maleShare - result.femaleShare, GENDER_GAP);
  closeTo(result.maleGroupTotal + result.femaleGroupTotal, result.total);
}

{
  const result = calculate({
    maleCount: 2,
    femaleCount: 0,
    courtDuration: 3,
    ball1Price: 0,
    ball1Count: 0,
    ball2Price: 0,
    ball2Count: 0,
  });

  assert.equal(result.status, "ready");
  assert.equal(result.distribution, "maleOnly");
  closeTo(result.maleShare, 35);
  assert.equal(result.femaleShare, null);
}

{
  const result = calculate({
    maleCount: 0,
    femaleCount: 4,
    courtDuration: 1.5,
    ball1Price: 12,
    ball1Count: 2,
    ball2Price: 0,
    ball2Count: 0,
  });

  assert.equal(result.status, "ready");
  assert.equal(result.distribution, "femaleOnly");
  closeTo(result.total, 59);
  closeTo(result.femaleShare, 14.75);
  assert.equal(result.maleShare, null);
}

{
  const result = calculate({
    maleCount: 20,
    femaleCount: 1,
    courtDuration: 1.5,
    ball1Price: 0,
    ball1Count: 0,
    ball2Price: 0,
    ball2Count: 0,
  });

  assert.equal(result.status, "invalid");
  assert.equal(result.femaleShare, null);
}

{
  const result = calculate({
    maleCount: 0,
    femaleCount: 0,
    courtDuration: 3,
    ball1Price: 10,
    ball1Count: 2,
    ball2Price: 0,
    ball2Count: 0,
  });

  assert.equal(result.status, "incomplete");
  closeTo(result.total, 90);
}

console.log("All calculator tests passed.");
