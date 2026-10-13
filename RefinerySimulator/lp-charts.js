/* Saved LP sensitivity experiment and independent, two-variable educational LP. */
(() => {
  const $ = (id) => document.getElementById(id);
  const number = (value) => value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
  const mix = (values) =>
    values.map((v, i) => `${["X", "Y", "Z"][i]} ${Math.round(v * 100)}%`).join(" · ");
  const colors = ["#148c96", "#dd8242", "#8065c4", "#4a8f56", "#bf527a"];
  const data = window.CF_CAPACITY_RESULTS;
  if (data && $("capacityChart")) {
    const points = data.points;
    const feasible = points.filter((p) => p.best);
    const values = feasible.map((p) => p.best.lp_profit / 1e6);
    const low = Math.floor(Math.min(...values, 0));
    const high = Math.ceil(Math.max(...values, 1));
    const x = (b) => 85 + ((b - 12000) / 18000) * 620;
    const y = (v) => 295 - ((v - low) / (high - low)) * 235;
    const keys = [...new Set(feasible.map((p) => p.best.mix.join(",")))];
    function renderCapacity() {
      const selected = points[+$("capacityPoint").value];
      $("capacityValue").textContent = number(selected.budget);
      let svg =
        '<svg viewBox="0 0 780 390" role="img" aria-label="하루 작업량 한도에 따른 LP 최대 이익">';
      for (let i = 0; i <= 4; i++) {
        const v = low + ((high - low) * i) / 4;
        svg += `<path class="lp-grid" d="M85 ${y(v)}H705"/><text x="75" y="${y(v) + 4}" text-anchor="end">${number(v)}</text>`;
      }
      points.forEach((p, i) => {
        if (!p.best)
          svg += `<rect x="${x(p.budget) - 15}" y="60" width="30" height="235" fill="#e12635" opacity=".12"/>`;
        else
          svg += `<rect x="${x(p.budget) - 15}" y="310" width="30" height="8" fill="${colors[keys.indexOf(p.best.mix.join(",")) % colors.length]}"/>`;
        if (i % 3 === 0)
          svg += `<text x="${x(p.budget)}" y="338" text-anchor="middle">${number(p.budget)}</text>`;
      });
      let path = "";
      let active = false;
      points.forEach((p) => {
        if (!p.best) {
          active = false;
          return;
        }
        path += `${active ? "L" : "M"}${x(p.budget)} ${y(p.best.lp_profit / 1e6)} `;
        active = true;
      });
      svg += `<path d="${path}" fill="none" stroke="var(--accent)" stroke-width="3"/>`;
      points.forEach((p, i) => {
        if (!p.best) return;
        svg += `<circle data-capacity="${i}" tabindex="0" role="button" aria-label="작업량 한도 선택" cx="${x(p.budget)}" cy="${y(p.best.lp_profit / 1e6)}" r="${p === selected ? 7 : 4}" fill="${p === selected ? "#e12635" : "var(--accent)"}"><title>한도 ${number(p.budget)} · 이익 $${number(p.best.lp_profit)} · ${mix(p.best.mix)}</title></circle>`;
      });
      svg += `<path d="M${x(selected.budget)} 55V320" stroke="#e12635" stroke-dasharray="5 5"/><text x="85" y="28">최대 모형상 이익 (백만 USD)</text><text x="395" y="377" text-anchor="middle">하루 처리 작업량 한도 (작업량 단위/일)</text></svg>`;
      $("capacityChart").innerHTML = svg.replaceAll(
        'aria-label="작업량 한도 선택"',
        'aria-label="작업량 한도 선택"',
      );
      const previous = points[+$("capacityPoint").value - 1];
      $("capacityDetail").textContent = selected.best
        ? `선택한 한도 ${number(selected.budget)}: LP 권고 ${mix(selected.best.mix)} · 최대 모형상 이익 $${number(selected.best.lp_profit)} · 계약 충족 후보 ${selected.feasible}/231개. ` +
          (previous?.best
            ? `직전 계산 한도보다 작업량 1,000단위를 늘렸을 때 이익 변화는 $${number(selected.best.lp_profit - previous.best.lp_profit)}입니다. 이는 구간 비교이며 그림자가격이 아닙니다.`
            : "")
        : `한도 ${number(selected.budget)}에서는 계약을 지키는 조합이 없습니다.`;
    }
    $("capacityPoint").addEventListener("input", renderCapacity);
    $("capacityChart").addEventListener("click", (event) => {
      const t = event.target.closest("[data-capacity]");
      if (t) {
        $("capacityPoint").value = t.dataset.capacity;
        renderCapacity();
      }
    });
    $("capacityChart").addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        const t = event.target.closest("[data-capacity]");
        if (t) {
          event.preventDefault();
          $("capacityPoint").value = t.dataset.capacity;
          renderCapacity();
        }
      }
    });
    renderCapacity();
  }
  // Clip a convex polygon by a*x+b*y <= c; intersections are calculated exactly.
  function clip(polygon, a, b, c) {
    const out = [];
    polygon.forEach((p, i) => {
      const q = polygon[(i + 1) % polygon.length],
        d = a * p[0] + b * p[1] - c,
        e = a * q[0] + b * q[1] - c;
      if (d <= 1e-9) out.push(p);
      if (d > 1e-9 !== e > 1e-9) {
        const t = d / (d - e);
        out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
      }
    });
    return out;
  }
  function solveToy(budget) {
    const constraints = [
      [1, 1, 20],
      [1.4, 1, budget],
      [-0.25, -0.3, -5],
      [-0.35, -0.45, -5],
      [1, 0, 14],
      [0, 1, 16],
    ];
    const polygon = constraints.reduce(
      (p, [a, b, c]) => clip(p, a, b, c),
      [
        [0, 0],
        [24, 0],
        [24, 24],
        [0, 24],
      ],
    );
    const best = polygon.reduce(
      (v, p) => (!v || 9 * p[0] + 6 * p[1] > 9 * v[0] + 6 * v[1] ? p : v),
      null,
    );
    return { polygon, best, profit: best ? 9 * best[0] + 6 * best[1] : null };
  }
  window.CFLPLearning = { solveToy };
  if (!$("learningChart")) return;
  function renderLearning() {
    const budget = +$("learningBudget").value,
      goal = +$("learningProfit").value,
      result = solveToy(budget);
    $("learningBudgetValue").textContent = number(budget * 1000) + " 작업량 단위/일";
    $("learningProfitValue").textContent = "$" + number(goal * 1000) + "/일";
    const x = (v) => 75 + (v / 24) * 580,
      y = (v) => 350 - (v / 24) * 290;
    let svg = '<svg viewBox="0 0 760 435" role="img" aria-label="교육용 LP 가능 영역과 이익선">';
    for (let i = 0; i <= 24; i += 4)
      svg += `<path class="lp-grid" d="M${x(i)} 60V350M75 ${y(i)}H655"/><text x="${x(i)}" y="370" text-anchor="middle">${i}</text><text x="65" y="${y(i) + 4}" text-anchor="end">${i}</text>`;
    if (result.polygon.length)
      svg += `<polygon points="${result.polygon.map((p) => `${x(p[0])},${y(p[1])}`).join(" ")}" fill="var(--accent)" fill-opacity=".25" stroke="var(--accent)" stroke-width="2"/>`;
    const lines = [
      [1, 1, 20, "#648ec4", "처리량"],
      [1.4, 1, budget, "#dd8242", "작업량"],
      [0.25, 0.3, 5, "#9e6bc7", "휘발유 계약"],
      [0.35, 0.45, 5, "#4f9864", "경유 계약"],
    ];
    function line(a, b, c, color, dash = "") {
      const hits = [];
      for (const p of [
        [0, c / b],
        [24, (c - a * 24) / b],
        [c / a, 0],
        [(c - b * 24) / a, 24],
      ])
        if (
          p.every((v) => v >= -1e-9 && v <= 24 + 1e-9) &&
          !hits.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-6)
        )
          hits.push(p);
      return hits.length >= 2
        ? `<path d="M${x(hits[0][0])} ${y(hits[0][1])}L${x(hits[1][0])} ${y(hits[1][1])}" stroke="${color}" stroke-width="2" ${dash ? 'stroke-dasharray="' + dash + '"' : ""}/>`
        : "";
    }
    lines.forEach(([a, b, c, color]) => (svg += line(a, b, c, color)));
    svg +=
      `<path d="M${x(14)} 60V350M75 ${y(16)}H655" stroke="var(--muted)" stroke-dasharray="3 4"/>` +
      line(9, 6, goal, "#e12635", "7 5");
    if (result.best)
      svg += `<circle cx="${x(result.best[0])}" cy="${y(result.best[1])}" r="7" fill="#e12635"><title>최적점: ${number(result.best[0])}, ${number(result.best[1])}</title></circle>`;
    svg +=
      '<text x="75" y="28">Y 원유 투입량 (천 배럴/일)</text><text x="365" y="403" text-anchor="middle">X 원유 투입량 (천 배럴/일)</text></svg>';
    $("learningChart").innerHTML =
      svg.replace(
        'aria-label="교육용 LP 가능 영역과 이익선"',
        'aria-label="교육용 LP 가능 영역과 이익선"',
      ) +
      '<p class="note">범례: 청록 면=가능 영역 · 파랑=처리량 한도 · 주황=작업량 한도 · 보라=휘발유 계약 · 초록=경유 계약 · 회색 점선=원유 사용 가능량 · 붉은 점선=이익선 · 붉은 점=최적점</p>';
    $("learningDetail").textContent = result.best
      ? `최적 투입: X ${number(result.best[0] * 1000)}배럴, Y ${number(result.best[1] * 1000)}배럴. 하루 최대 이익 $${number(result.profit * 1000)}. ` +
        (goal > result.profit + 0.01
          ? "지금 이익선은 가능한 영역을 벗어났습니다. 목표 이익을 낮춰 보세요."
          : Math.abs(goal - result.profit) < 0.01
            ? "이익선이 최적점에 닿았습니다. 이보다 높은 이익은 조건을 지키며 달성할 수 없습니다."
            : "이익선을 더 높은 금액으로 옮겨 보세요.")
      : "이 작업량 한도에서는 계약을 지킬 수 있는 투입 조합이 없습니다. 한도를 늘려 보세요.";
    $("learningOptimum").disabled = !result.best;
  }
  ["learningBudget", "learningProfit"].forEach((id) =>
    $(id).addEventListener("input", renderLearning),
  );
  $("learningOptimum").addEventListener("click", () => {
    const r = solveToy(+$("learningBudget").value);
    if (r.best) {
      $("learningProfit").step = "any";
      $("learningProfit").value = r.profit;
      renderLearning();
    }
  });
  renderLearning();
})();
