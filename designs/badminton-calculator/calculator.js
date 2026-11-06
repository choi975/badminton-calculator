(function attachBadmintonCalculator(root, factory) {
  const calculator = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = calculator;
  } else {
    root.BadmintonCalculator = calculator;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createCalculator() {
  "use strict";

  const COURT_RATE_PER_HOUR = 70 / 3;
  const GENDER_GAP = 3.5;

  function toAmount(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function calculate(input) {
    const maleCount = Math.max(0, toAmount(input.maleCount));
    const femaleCount = Math.max(0, toAmount(input.femaleCount));
    const durationHours = Math.max(0, toAmount(input.courtDuration));
    const ball1Price = Math.max(0, toAmount(input.ball1Price));
    const ball1Count = Math.max(0, toAmount(input.ball1Count));
    const ball2Price = Math.max(0, toAmount(input.ball2Price));
    const ball2Count = Math.max(0, toAmount(input.ball2Count));

    const peopleCount = maleCount + femaleCount;
    const courtFee = COURT_RATE_PER_HOUR * durationHours;
    const ball1Fee = ball1Price * ball1Count;
    const ball2Fee = ball2Price * ball2Count;
    const ballFee = ball1Fee + ball2Fee;
    const total = courtFee + ballFee;

    const base = {
      maleCount,
      femaleCount,
      durationHours,
      courtFee,
      ball1Fee,
      ball2Fee,
      ballFee,
      total,
    };

    if (peopleCount <= 0 || total <= 0) {
      return {
        ...base,
        status: "incomplete",
        maleShare: null,
        femaleShare: null,
        maleGroupTotal: null,
        femaleGroupTotal: null,
      };
    }

    if (maleCount > 0 && femaleCount > 0) {
      const femaleShare = (total - GENDER_GAP * maleCount) / peopleCount;
      const maleShare = femaleShare + GENDER_GAP;

      if (femaleShare < -0.000001) {
        return {
          ...base,
          status: "invalid",
          maleShare: null,
          femaleShare: null,
          maleGroupTotal: null,
          femaleGroupTotal: null,
        };
      }

      return {
        ...base,
        status: "ready",
        distribution: "mixed",
        femaleShare,
        maleShare,
        maleGroupTotal: maleShare * maleCount,
        femaleGroupTotal: femaleShare * femaleCount,
      };
    }

    if (maleCount > 0) {
      const maleShare = total / maleCount;
      return {
        ...base,
        status: "ready",
        distribution: "maleOnly",
        maleShare,
        femaleShare: null,
        maleGroupTotal: total,
        femaleGroupTotal: null,
      };
    }

    const femaleShare = total / femaleCount;
    return {
      ...base,
      status: "ready",
      distribution: "femaleOnly",
      maleShare: null,
      femaleShare,
      maleGroupTotal: null,
      femaleGroupTotal: total,
    };
  }

  return {
    COURT_RATE_PER_HOUR,
    GENDER_GAP,
    calculate,
  };
});
