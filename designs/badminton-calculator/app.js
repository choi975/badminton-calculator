(function startBadmintonCalculator() {
  "use strict";

  const calculator = window.BadmintonCalculator;
  const form = document.querySelector("#calculatorForm");
  if (!calculator || !form) return;

  const STORAGE_KEY = "badminton-calculator:v1";
  const inputs = Array.from(form.querySelectorAll("input[data-calculator-input], input[type='number']"));
  const requiredCountInputs = new Set(["maleCount", "femaleCount", "ball1Count", "ball2Count"]);

  const elements = {
    resultPanel: document.querySelector("#resultPanel"),
    resultState: document.querySelector("#resultState span"),
    totalAmount: document.querySelector("#totalAmount"),
    costBreakdown: document.querySelector("#costBreakdown"),
    malePeople: document.querySelector("#malePeople"),
    femalePeople: document.querySelector("#femalePeople"),
    maleShare: document.querySelector("#maleShare"),
    femaleShare: document.querySelector("#femaleShare"),
    maleMeta: document.querySelector("#maleMeta"),
    femaleMeta: document.querySelector("#femaleMeta"),
    maleGroupTotal: document.querySelector("#maleGroupTotal"),
    femaleGroupTotal: document.querySelector("#femaleGroupTotal"),
    resultNote: document.querySelector("#resultNote"),
    copyButton: document.querySelector("#copyButton"),
    copyButtonLabel: document.querySelector("#copyButton span"),
    copyStatus: document.querySelector("#copyStatus"),
    courtFeeDetail: document.querySelector("#courtFeeDetail"),
    ball1FeeDetail: document.querySelector("#ball1FeeDetail"),
    ball2FeeDetail: document.querySelector("#ball2FeeDetail"),
    resetButton: document.querySelector("#resetButton"),
  };

  let lastCopyText = "";
  let copyFeedbackTimer = 0;

  const moneyFormatter = new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  function formatMoney(value) {
    return value === null || value === undefined || !Number.isFinite(value)
      ? "—"
      : moneyFormatter.format(value);
  }

  function readInput(input) {
    if (input.value.trim() === "") return 0;
    const number = Number(input.value);
    return Number.isFinite(number) ? number : Number.NaN;
  }

  function collectInput() {
    return inputs.reduce((values, input) => {
      values[input.name] = readInput(input);
      return values;
    }, {});
  }

  function setFieldError(input, message) {
    const messageElement = document.querySelector(`#${input.id}Message`);
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (messageElement) messageElement.textContent = message;
  }

  function validateInputs(values) {
    let isValid = true;

    inputs.forEach((input) => {
      const value = values[input.name];
      let message = "";

      if (!Number.isFinite(value)) {
        message = "请输入有效数字";
      } else if (value < 0) {
        message = "不能小于 0";
      } else if (requiredCountInputs.has(input.name) && !Number.isInteger(value)) {
        message = "请填写整数";
      }

      if (message) isValid = false;
      setFieldError(input, message);
    });

    return isValid;
  }

  function setState(state, label) {
    elements.resultPanel.dataset.state = state;
    elements.resultState.textContent = label;
  }

  function setShare(personElement, shareElement, metaElement, groupElement, count, share, groupTotal) {
    personElement.textContent = `${count} 人`;

    if (share === null || share === undefined) {
      shareElement.textContent = "—";
      metaElement.textContent = count > 0 ? "本场未设置此类人数" : "等待填写人数";
      groupElement.textContent = "¥—";
      return;
    }

    shareElement.textContent = formatMoney(share);
    groupElement.textContent = `¥${formatMoney(groupTotal)}`;
  }

  function buildCopyText(result) {
    if (result.status !== "ready") return "";

    const lines = [
      "羽球 AA · 本场结算",
      `总价：¥${formatMoney(result.total)}`,
      `场地费：¥${formatMoney(result.courtFee)}`,
      `球费：¥${formatMoney(result.ballFee)}`,
      "",
    ];

    if (result.maleShare !== null) {
      lines.push(`男生：${result.maleCount} 人 × ¥${formatMoney(result.maleShare)} = ¥${formatMoney(result.maleGroupTotal)}`);
    }
    if (result.femaleShare !== null) {
      lines.push(`女生：${result.femaleCount} 人 × ¥${formatMoney(result.femaleShare)} = ¥${formatMoney(result.femaleGroupTotal)}`);
    }
    if (result.distribution === "mixed") {
      lines.push("规则：女生每人少付 ¥3.50");
    }

    return lines.join("\n");
  }

  function resetCopyFeedback() {
    window.clearTimeout(copyFeedbackTimer);
    elements.copyButtonLabel.textContent = "复制结算";
    elements.copyStatus.textContent = "";
  }

  function render() {
    const values = collectInput();
    const valid = validateInputs(values);
    const result = calculator.calculate(values);
    const hasPeople = result.maleCount + result.femaleCount > 0;
    const hasCost = result.total > 0;
    const feePlaceholder = "—";

    elements.courtFeeDetail.textContent = `¥${hasCost ? formatMoney(result.courtFee) : feePlaceholder}`;
    elements.ball1FeeDetail.textContent = `¥${hasCost ? formatMoney(result.ball1Fee) : feePlaceholder}`;
    elements.ball2FeeDetail.textContent = `¥${hasCost ? formatMoney(result.ball2Fee) : feePlaceholder}`;

    setShare(
      elements.malePeople,
      elements.maleShare,
      elements.maleMeta,
      elements.maleGroupTotal,
      result.maleCount,
      result.maleShare,
      result.maleGroupTotal,
    );
    setShare(
      elements.femalePeople,
      elements.femaleShare,
      elements.femaleMeta,
      elements.femaleGroupTotal,
      result.femaleCount,
      result.femaleShare,
      result.femaleGroupTotal,
    );

    elements.costBreakdown.innerHTML = hasCost
      ? `场地费 ¥${formatMoney(result.courtFee)} <span>+</span> 球费 ¥${formatMoney(result.ballFee)}`
      : `场地费 ¥${feePlaceholder} <span>+</span> 球费 ¥${feePlaceholder}`;

    if (!valid) {
      setState("error", "需检查");
      elements.totalAmount.textContent = "—";
      elements.resultNote.textContent = "有输入项格式不正确，请先检查标红的数字。";
      elements.copyButton.disabled = true;
      elements.copyButton.setAttribute("aria-disabled", "true");
      lastCopyText = "";
      resetCopyFeedback();
      return;
    }

    if (!hasPeople) {
      setState("waiting", "待填写");
      elements.totalAmount.textContent = "—";
      elements.resultNote.textContent = "请先填写人数和费用，结算结果会自动出现在这里。";
      elements.copyButton.disabled = true;
      elements.copyButton.setAttribute("aria-disabled", "true");
      lastCopyText = "";
      resetCopyFeedback();
      return;
    }

    if (result.total <= 0) {
      setState("waiting", "待填写");
      elements.totalAmount.textContent = "0.00";
      elements.resultNote.textContent = "人数已填好，再补充场地时长或用球费用即可结算。";
      elements.copyButton.disabled = true;
      elements.copyButton.setAttribute("aria-disabled", "true");
      lastCopyText = "";
      resetCopyFeedback();
      return;
    }

    if (result.status === "invalid") {
      setState("error", "需检查");
      elements.totalAmount.textContent = formatMoney(result.total);
      elements.resultNote.textContent = "当前总价不足以覆盖 ¥3.50 的男女差额，请检查人数和费用。";
      elements.copyButton.disabled = true;
      elements.copyButton.setAttribute("aria-disabled", "true");
      lastCopyText = "";
      resetCopyFeedback();
      return;
    }

    setState("ready", "已算出");
    elements.totalAmount.textContent = formatMoney(result.total);
    elements.copyButton.disabled = false;
    elements.copyButton.removeAttribute("aria-disabled");
    lastCopyText = buildCopyText(result);

    if (result.distribution === "mixed") {
      elements.maleMeta.textContent = `${result.maleCount} 人 × ¥${formatMoney(result.maleShare)}`;
      elements.femaleMeta.textContent = `${result.femaleCount} 人 × ¥${formatMoney(result.femaleShare)}`;
      elements.resultNote.textContent = "女生每人少付 ¥3.50，差额已经计入本场总价。";
    } else if (result.distribution === "maleOnly") {
      elements.maleMeta.textContent = `仅男性 · ${result.maleCount} 人直接均摊`;
      elements.femaleMeta.textContent = "本场无女性";
      elements.resultNote.textContent = "本场只有男性，已按人数直接均摊。";
    } else {
      elements.maleMeta.textContent = "本场无男性";
      elements.femaleMeta.textContent = `仅女性 · ${result.femaleCount} 人直接均摊`;
      elements.resultNote.textContent = "本场只有女性，已按人数直接均摊。";
    }

    resetCopyFeedback();
  }

  function saveInput() {
    try {
      const values = inputs.reduce((saved, input) => {
        saved[input.name] = input.value;
        return saved;
      }, {});
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch {
      // The calculator still works if storage is blocked by the browser.
    }
  }

  function restoreInput() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      inputs.forEach((input) => {
        if (Object.prototype.hasOwnProperty.call(saved, input.name)) {
          input.value = saved[input.name];
        }
      });
    } catch {
      // Ignore malformed or unavailable saved data.
    }
  }

  async function copyResult() {
    if (!lastCopyText) return;

    try {
      await navigator.clipboard.writeText(lastCopyText);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = lastCopyText;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
    }

    elements.copyButtonLabel.textContent = "已复制";
    elements.copyStatus.textContent = "可直接粘贴到微信群";
    window.clearTimeout(copyFeedbackTimer);
    copyFeedbackTimer = window.setTimeout(() => {
      elements.copyButtonLabel.textContent = "复制结算";
      elements.copyStatus.textContent = "";
    }, 2200);
  }

  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      render();
      saveInput();
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  elements.resetButton.addEventListener("click", () => {
    form.reset();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing else is required if storage is unavailable.
    }
    inputs.forEach((input) => setFieldError(input, ""));
    render();
    inputs[0].focus();
  });

  elements.copyButton.addEventListener("click", copyResult);
  document.querySelector("#footerYear").textContent = String(new Date().getFullYear());

  restoreInput();
  render();
})();
