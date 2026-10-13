const $ = (id) => document.getElementById(id);
const n = (v) => Math.round(v).toLocaleString("ko-KR");
const mixLabel = (r) => r.mix.map((w, i) => "XYZ"[i] + " " + Math.round(w * 100) + "%").join(" · ");
let current;
let selectedCandidate = null,
  latestResult,
  latestOptions;
let handles = [
  { day: 20, value: 1 },
  { day: 40, value: 1 },
];
function table(headers, rows) {
  return (
    "<table><thead><tr>" +
    headers.map((h) => "<th>" + h + "</th>").join("") +
    "</tr></thead><tbody>" +
    rows.map((row) => "<tr>" + row.map((v) => "<td>" + v + "</td>").join("") + "</tr>").join("") +
    "</tbody></table>"
  );
}
function chart(id, series, maxValue, threshold = 0) {
  const colors = ["#087f8c", "#cf702c", "#7763ad"];
  const W = 760,
    H = 280,
    L = 78,
    R = 22,
    T = 20,
    B = 55,
    width = W - L - R,
    height = H - T - B;
  const max = Math.max(1, maxValue, threshold);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${id} 시계열"><path d="M${L},${T}V${H - B}H${W - R}" stroke="#9aaeb7" fill="none"/>`;
  for (let i = 0; i <= 4; i++) {
    let y = T + (height * i) / 4;
    s += `<text x="${L - 8}" y="${y + 5}" text-anchor="end" font-size="12">${n(max * (1 - i / 4))}</text><path d="M${L},${y}H${W - R}" stroke="#e3ebed"/>`;
  }
  if (threshold)
    s += `<path d="M${L},${T + height * (1 - threshold / max)}H${W - R}" stroke="#8699a0" stroke-dasharray="6 4"/>`;
  series.forEach((a, j) => {
    s += `<polyline fill="none" data-series="${a.key || j}" stroke="${a.color || colors[j]}" stroke-dasharray="${a.dash || "none"}" stroke-width="2.5" points="${a.values.map((v, i) => `${L + (i / (a.values.length - 1)) * width},${T + height * (1 - v / max)}`).join(" ")}"/>${id === "inventory" ? "" : `<text x="${L + j * 190}" y="${H - 8}" fill="${a.color || colors[j]}" font-size="13">━ ${a.name}</text>`}`;
  });
  [1, 15, 30, 45, 60].forEach(
    (day) =>
      (s += `<text x="${L + ((day - 1) / 59) * width}" y="${H - B + 22}" text-anchor="middle" font-size="12">${day}일</text>`),
  );
  $(id).innerHTML = s + "</svg>";
}
// Legend checkbox state belongs to the controls and survives scenario changes.
function drawInventory(r) {
  const definitions = [
    { key: "gasoline", name: "휘발유", color: "#087f8c", values: r.path.map((v) => v.products[0]) },
    { key: "diesel", name: "경유", color: "#cf702c", values: r.path.map((v) => v.products[1]) },
    { key: "residual", name: "잔사유", color: "#7763ad", values: r.path.map((v) => v.products[2]) },
    {
      key: "gasolineContract",
      name: "계약(휘발유)",
      color: "#d62828",
      dash: "8 4",
      values: r.path.map(() => r.contracts[0]),
    },
    {
      key: "dieselContract",
      name: "계약(경유)",
      color: "#e64949",
      dash: "2 4",
      values: r.path.map(() => r.contracts[1]),
    },
  ];
  const visible = definitions.filter((a) => document.getElementById("inventory-" + a.key).checked);
  chart("inventory", visible, 120000, 120000);
}
let lastContracts = [CF.defaults.gasolineContract, CF.defaults.dieselContract];
function render() {
  const o = {};
  for (const k of ["discount", "delay", "initialDays", "budget", "amplitude"]) {
    o[k] = +$(k).value;
    $(k + "V").textContent = n(o[k]) + (k === "amplitude" ? "%" : "");
  }
  const contractInputs = [$("gasolineContract"), $("dieselContract")];
  const validContracts = contractInputs.every(
    (input) => input.value !== "" && input.checkValidity(),
  );
  const changedContracts =
    validContracts && contractInputs.some((input, j) => +input.value !== lastContracts[j]);
  if (validContracts) lastContracts = contractInputs.map((input) => +input.value);
  if (changedContracts) {
    $("heatmap").innerHTML = "";
    $("heatstatus").textContent =
      "계약량이 바뀌었습니다. ‘현재 조건으로 지도 계산’을 눌러 새 계약 조건의 할인·지연 지도를 생성해 주세요.";
  }
  $("contractInputStatus").textContent = validContracts
    ? "값을 바꾸면 기본 분석을 다시 계산합니다. 저장된 LP 실험과 교육용 예시는 별개입니다."
    : "계약량은 0~120,000 사이의 정수로 입력해 주세요. 입력 중에는 마지막 유효한 계약량으로 계산합니다.";
  [o.gasolineContract, o.dieselContract] = lastContracts;
  document.querySelectorAll("[data-contract]").forEach((element) => {
    element.textContent = n(lastContracts[element.dataset.contract === "gasoline" ? 0 : 1]);
  });
  o.amplitude /= 100;
  o.scenario = $("scenario").value;
  o.points = handles.map((p) => ({ ...p }));
  drawEditor(o);
  const result = CF.evaluate(o),
    r =
      selectedCandidate === null ? result.best || result.diagnostic : result.all[selectedCandidate];
  current = r;
  const context = document.getElementById("candidateContext");
  if (context) {
    const mode =
      selectedCandidate !== null
        ? "지도를 클릭해 직접 선택한 조합입니다."
        : result.best
          ? "현재 조건에서 계약을 지키고 이익이 가장 큰 조합을 자동으로 골랐습니다."
          : "계약을 모두 지킬 수 있는 조합이 없어, 부족량이 가장 적은 조합을 보여드립니다. 권고안은 아닙니다.";
    context.innerHTML = `<h3 style="margin:0 0 6px">현재 조회중인 조합:</h3><p style="margin:0"><strong>${mixLabel(r)}</strong><br><span>- 계약 충족여부: ${r.feasible ? "60일 모두 충족" : "미충족. 부족 발생"}</span></p><p style="margin:6px 0">${mode}</p><p style="margin:0" class="note">삼각차트에서 원을 클릭해보세요. 생산·재고와 손익 페이지는 이 조합의 결과를 보여줍니다. ‘권고 조합’ 카드와 ‘기준 전략과 비교’ 표는 직접 선택이 아닌, '추천 결과'를 보여줍니다.</p>`;
  }
  latestResult = result;
  latestOptions = o;
  CFMaps.cancel();
  $("heatmap").innerHTML = "";
  $("heatstatus").textContent = "조건이 변경되었습니다. 버튼을 눌러 지도를 다시 계산하세요.";
  CFMaps.ternary(result, selectedCandidate);
  $("selection").textContent =
    selectedCandidate === null
      ? "아래 결과: " + (result.best ? "권고 후보" : "부족 최소 진단 후보")
      : "아래 결과: 직접 선택한 " +
        mixLabel(r) +
        " · " +
        (r.feasible ? "계약 충족" : "계약 미충족");
  $("decision").className = result.best ? "ok" : "bad";
  $("decision").innerHTML =
    /* HTML */
    `<h2>${result.best ? "권고 조합" : "계약 충족 가능한 조합 없음"}</h2>
      <strong>${mixLabel(result.best || result.diagnostic)}</strong>
      <p>
        ${result.best ? "" : "아래는 부족량 최소 후보의 진단 결과이며 권고안이 아닙니다. "}충족 후보
        ${result.feasible.length}/231개 · 동률 ${result.ties.length}개
      </p>
      <p>
        경제적 성과 $${n((result.best || result.diagnostic).profit)} · 부족일
        ${(result.best || result.diagnostic).shortageDays}일<br />휘발유 부족
        ${n((result.best || result.diagnostic).deficits[0])}배럴 · 경유 부족
        ${n((result.best || result.diagnostic).deficits[1])}배럴
      </p>`;
  chart(
    "prices",
    CF.base.map((p, j) => ({
      name: ["휘발유", "경유", "잔사유"][j],
      values: r.path.map((v) => v.prices[j]),
    })),
    Math.max(...r.path.flatMap((v) => v.prices)),
  );
  drawInventory(r);
  chart(
    "throughput",
    [{ name: "실제 원유 처리량", values: r.path.map((v) => v.run) }],
    20000,
    20000,
  );
  chart(
    "workload",
    [{ name: "실제 작업부하량", values: r.path.map((v) => v.load) }],
    o.budget,
    o.budget,
  );
  $("shortage").innerHTML = table(
    ["제품", "60일 계약량", "실제 계약 공급", "부족"],
    ["휘발유", "경유"].map((p, j) => [
      p,
      n(60 * r.contracts[j]),
      n(60 * r.contracts[j] - r.deficits[j]),
      n(r.deficits[j]),
    ]),
  );
  $("finance").innerHTML =
    table(
      ["항목", "USD"],
      [
        ["기간 매출 (Total revenue)", r.revenue],
        ["원유 구매비 (Purchase cost)", -r.purchase],
        ["원유 운송비 (Freight cost)", -r.freight],
        ["처리비 (Processing cost)", -r.processing],
        ["저장비 (Storage cost)", -r.holding],
        ["하역비 (Unloading cost)", -r.unloading],
        ["제품 출하비 (Shipping cost)", -r.shipping],
        ["재고 평가 전 매출−비용 (Revenue less costs)", r.cashContribution],
        ["기말 재고 가치 (Closing inventory value · 비현금)", r.terminal],
        ["기초 재고 가치 (Opening inventory value · 비현금)", -r.opening],
        ["모형상 이익 (Modelled economic profit)", r.profit],
      ].map(([k, v]) => [k, n(v)]),
    ) +
    `<p class="note">기말 제품 처분에는 최대 ${r.liquidation.days}일이 추가로 필요합니다. 처분 저장비 $${n(r.liquidation.holding)}, 출하비 $${n(r.liquidation.shipping)}는 기말 가치에 이미 반영됩니다.</p>`;
  CFBreak.render(r);
  CFBench.render(o, result);
  $("comparison").innerHTML = table(
    ["경로", "권고", "충족 후보", "경제적 성과"],
    ["flat", "quadratic", "wave", "custom"].map((s) => {
      const t = CF.evaluate({ ...o, scenario: s, points: handles });
      return [
        s,
        t.best ? mixLabel(t.best) : "충족 불가",
        t.feasible.length,
        t.best ? "$" + n(t.best.profit) : "—",
      ];
    }),
  );
  const sorted = result.all
    .slice()
    .sort((a, b) => Number(b.feasible) - Number(a.feasible) || b.profit - a.profit);
  $("candidates").innerHTML = table(
    ["구매 구성비", "계약 충족", "부족일", "휘발유 부족", "경유 부족", "성과 USD"],
    sorted.map((v) => [
      mixLabel(v),
      v.feasible ? "충족" : "미충족",
      v.shortageDays,
      n(v.deficits[0]),
      n(v.deficits[1]),
      n(v.profit),
    ]),
  );
  // Appearance listeners run only after the updated results have been rendered.
  document.dispatchEvent(new Event("crudeflow:recalculated"));
}
for (const id of [
  "scenario",
  "amplitude",
  "discount",
  "delay",
  "initialDays",
  "budget",
  "gasolineContract",
  "dieselContract",
])
  $(id).addEventListener("input", () => {
    selectedCandidate = null;
    render();
  });
$("dashboardTab").onclick = () => {
  $("dashboard").hidden = false;
  $("code").hidden = true;
};
$("codeTab").onclick = () => {
  $("dashboard").hidden = true;
  $("code").hidden = false;
};
fetch("engine.js")
  .then((r) => r.text())
  .then((t) => ($("source").textContent = t))
  .catch(
    () =>
      ($("source").textContent =
        "동봉된 engine.js 파일에서 코드를 확인해 주세요. 로컬 서버에서는 이 영역에도 표시됩니다."),
  );
function drawEditor(o) {
  const L = 65,
    W = 665,
    T = 15,
    H = 190;
  const x = (d) => L + ((d - 1) / 59) * W,
    y = (v) => T + (1.5 - v) * H;
  let html = '<path d="M65 15V205H730" fill="none" stroke="#9aaeb7"/>';
  [0.5, 0.75, 1, 1.25, 1.5].forEach(
    (v) =>
      (html += `<path d="M65 ${y(v)}H730" stroke="${v === 1 ? "#a1b5bd" : "#e5ecee"}" stroke-dasharray="4 4"/><text x="57" y="${y(v) + 4}" text-anchor="end" font-size="12">${Math.round(v * 100)}%</text>`),
  );
  html += `<polyline fill="none" stroke="#178278" stroke-width="3" points="${Array.from(
    { length: 120 },
    (_, i) => {
      const d = 1 + (i * 59) / 119;
      return x(d) + "," + y(CF.factor(d, o));
    },
  ).join(" ")}"/>`;
  [1, 20, 40, 60].forEach(
    (d) => (html += `<text x="${x(d)}" y="228" text-anchor="middle" font-size="12">${d}일</text>`),
  );
  html +=
    '<text x="400" y="253" text-anchor="middle" font-size="12">X축: 일차 · Y축: 기준가격 대비 비율</text>';
  handles.forEach((p, i) => {
    const v = o.scenario === "custom" ? p.value : CF.factor(p.day, o);
    html += `<circle data-handle="${i}" cx="${x(p.day)}" cy="${y(v)}" r="11" fill="#fff" stroke="#178278" stroke-width="3" tabindex="0" role="slider" aria-label="가격 제어점 ${i + 1}, ${p.day}일" aria-valuemin="50" aria-valuemax="150" aria-valuenow="${Math.round(v * 100)}" style="cursor:grab"/>`;
  });
  $("editor").innerHTML = html;
  $("handleStatus").textContent = handles
    .map(
      (p, i) =>
        `점 ${i + 1}: ${p.day}일 / ${Math.round((o.scenario === "custom" ? p.value : CF.factor(p.day, o)) * 100)}%`,
    )
    .join(" · ");
}
let dragging = null,
  pointer = null;
const editor = $("editor");
function makeCustom() {
  if ($("scenario").value !== "custom") {
    const o = { scenario: $("scenario").value, amplitude: +$("amplitude").value / 100 };
    handles = handles.map((p) => ({ day: p.day, value: CF.factor(p.day, o) }));
    $("scenario").value = "custom";
  }
}
editor.addEventListener("pointerdown", (e) => {
  const i = e.target.dataset.handle;
  if (i === undefined || dragging !== null) return;
  e.preventDefault();
  makeCustom();
  dragging = +i;
  pointer = e.pointerId;
  editor.setPointerCapture(pointer);
});
editor.addEventListener("pointermove", (e) => {
  if (dragging === null || e.pointerId !== pointer) return;
  const pt = editor.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const xy = pt.matrixTransform(editor.getScreenCTM().inverse());
  const lo = dragging === 0 ? 2 : handles[0].day + 1,
    hi = dragging === 0 ? handles[1].day - 1 : 59;
  handles[dragging] = {
    day: Math.max(lo, Math.min(hi, Math.round(1 + ((xy.x - 65) / 665) * 59))),
    value: Math.max(0.5, Math.min(1.5, Math.round((1.5 - (xy.y - 15) / 190) * 100) / 100)),
  };
  render();
});
function stopDrag(e) {
  if (e.pointerId !== pointer) return;
  dragging = null;
  pointer = null;
}
editor.addEventListener("pointerup", stopDrag);
editor.addEventListener("pointercancel", stopDrag);
editor.addEventListener("lostpointercapture", stopDrag);
editor.addEventListener("keydown", (e) => {
  const i = e.target.dataset.handle;
  if (i === undefined || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key))
    return;
  e.preventDefault();
  makeCustom();
  const j = +i,
    p = handles[j];
  p.day = Math.max(
    j === 0 ? 2 : handles[0].day + 1,
    Math.min(
      j === 0 ? handles[1].day - 1 : 59,
      p.day + (e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0),
    ),
  );
  p.value = Math.max(
    0.5,
    Math.min(1.5, p.value + (e.key === "ArrowUp" ? 0.01 : e.key === "ArrowDown" ? -0.01 : 0)),
  );
  render();
  editor.querySelector(`[data-handle="${j}"]`).focus();
});
$("resetPath").onclick = () => {
  handles = [
    { day: 20, value: 1 },
    { day: 40, value: 1 },
  ];
  $("scenario").value = "flat";
  render();
};
function candidateAction(e) {
  const i = e.target.dataset.candidate;
  if (i === undefined) return;
  selectedCandidate = +i;
  render();
}
$("mixmap").addEventListener("click", candidateAction);
$("mixmap").addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    candidateAction(e);
  }
});
$("showBest").onclick = () => {
  selectedCandidate = null;
  render();
};
$("contours").onchange = () => CFMaps.ternary(latestResult, selectedCandidate);
$("calculateMap").onclick = () => CFMaps.heatmap(latestOptions, $("heatmode").value);
$("heatmode").onchange = () => CFMaps.heatmap(latestOptions, $("heatmode").value);
function conditionAction(e) {
  const d = e.target.dataset.discount;
  if (d === undefined) return;
  $("discount").value = d;
  $("delay").value = e.target.dataset.delay;
  selectedCandidate = null;
  render();
}
$("heatmap").addEventListener("click", conditionAction);
$("heatmap").addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    conditionAction(e);
  }
});
$("breakmode").onchange = () => CFBreak.render(current);
$("fullFinance").onchange = () => CFBreak.render(current);
render();

$("inventoryLegend").addEventListener("change", () => drawInventory(current));
