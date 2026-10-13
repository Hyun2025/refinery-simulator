const CFBreak = (() => {
  const categories = [
    ["contract", "계약 매출 (Contract revenue)", "#087f8c"],
    ["extra", "추가 매출 (Additional sales revenue)", "#37b89a"],
    ["processing", "처리비 (Processing cost)", "#d16c30"],
    ["holding", "저장비 (Storage cost)", "#b7475d"],
    ["unloading", "하역비 (Unloading cost)", "#8f67ae"],
    ["shipping", "제품 출하비 (Shipping cost)", "#bda339"],
    ["purchase", "원유 구매비 (Purchase cost)", "#944431"],
    ["freight", "원유 운송비 (Freight cost)", "#776557"],
    ["opening", "기초 재고 가치 (Opening inventory value · 비현금)", "#647b91"],
    ["terminal", "기말 재고 가치 (Closing inventory value · 비현금)", "#82a43c"],
  ];
  const enabled = new Set(categories.map((c) => c[0]));
  let latest;
  const fmt = (v) => Math.round(v).toLocaleString("ko-KR");
  function rows(r, full) {
    const a = r.path.map((v) => ({ day: v.day, ...v.finance }));
    if (full) {
      a.unshift({ day: 0, purchase: -r.purchase, freight: -r.freight, opening: -r.opening });
      a[a.length - 1].terminal = r.terminal;
    }
    return a;
  }
  function render(r) {
    latest = r;
    const full = document.getElementById("fullFinance").checked,
      cumulative = document.getElementById("breakmode").value === "cumulative";
    const cats = categories.filter((_, i) => full || i < 6),
      raw = rows(r, full),
      sums = {};
    const data = raw.map((row) => {
      const out = { day: row.day };
      cats.forEach(([k]) => {
        sums[k] = (sums[k] || 0) + (row[k] || 0);
        out[k] = cumulative ? sums[k] : row[k] || 0;
      });
      return out;
    });
    document.getElementById("breaklegend").innerHTML = cats
      .map(
        ([k, label, color]) =>
          `<label style="display:inline-block;margin:5px 12px 5px 0;font-size:13px"><input type="checkbox" data-finance="${k}" ${enabled.has(k) ? "checked" : ""} style="width:auto"><span style="color:${color}">■</span> ${label}</label>`,
      )
      .join("");
    const active = cats.filter(([k]) => enabled.has(k));
    const totals = data.map((row) => {
      let pos = 0,
        neg = 0;
      active.forEach(([k]) => {
        if (row[k] >= 0) pos += row[k];
        else neg += row[k];
      });
      return { pos, neg, net: pos + neg };
    });
    const lo = Math.min(0, ...totals.map((v) => v.neg)),
      hi = Math.max(0, ...totals.map((v) => v.pos)),
      range = Math.max(1, hi - lo),
      L = 105,
      T = 25,
      H = 280,
      W = 680;
    const y = (v) => T + ((hi - v) / range) * H,
      x = (i) => L + ((i + 0.5) / data.length) * W;
    let svg = '<svg viewBox="0 0 820 380" role="img" aria-label="일자별 항목별 USD 금액">';
    for (let j = 0; j <= 4; j++) {
      const v = hi - (range * j) / 4;
      svg += `<path d="M${L} ${y(v)}H${L + W}" stroke="#e0e8eb"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11">${fmt(v)}</text>`;
    }
    svg += `<path d="M${L} ${y(0)}H${L + W}" stroke="#748b95"/>`;
    data.forEach((row, i) => {
      let pos = 0,
        neg = 0;
      active.forEach(([k, label, color]) => {
        const v = row[k] || 0,
          a = v >= 0 ? pos : neg,
          b = a + v;
        if (v >= 0) pos = b;
        else neg = b;
        if (v !== 0)
          svg += `<rect data-finance-day="${i}" x="${x(i) - (W / data.length) * 0.42}" y="${Math.min(y(a), y(b))}" width="${(W / data.length) * 0.84}" height="${Math.abs(y(a) - y(b))}" fill="${color}"><title>${row.day}일 · ${label}: $${fmt(v)}</title></rect>`;
      });
    });
    svg += `<polyline points="${totals.map((v, i) => x(i) + "," + y(v.net)).join(" ")}" fill="none" stroke="#172b35" stroke-width="2"/>`;
    data.forEach((row, i) => {
      svg += `<rect data-finance-day="${i}" x="${x(i) - (W / data.length) * 0.5}" y="${T}" width="${W / data.length}" height="${H}" fill="transparent" tabindex="0" role="button" aria-label="${row.day}일 상세"><title>${row.day}일 · 표시 항목 합계 $${fmt(totals[i].net)}</title></rect>`;
      if ([0, 1, 15, 30, 45, 60].includes(row.day))
        svg += `<text x="${x(i)}" y="330" text-anchor="middle" font-size="12">${row.day}</text>`;
    });
    svg +=
      '<text x="440" y="360" text-anchor="middle">X축: 일차</text><text transform="translate(18 165) rotate(-90)" text-anchor="middle">Y축: 금액 (USD)</text></svg>';
    document.getElementById("breakdown").innerHTML = svg;
    const sum = raw.reduce((s, row) => s + active.reduce((a, [k]) => a + (row[k] || 0), 0), 0);
    document.getElementById("breakstatus").textContent =
      `검은 선: 표시 항목 ${cumulative ? "누적" : "일별"} 합계. 표시 항목의 60일 합계: $${fmt(sum)}. 모든 항목을 포함한 합계는 위 표의 모형상 경제적 성과와 일치합니다. 날짜를 클릭하면 상세를 확인할 수 있습니다.`;
    function detail(i) {
      const row = data[i];
      document.getElementById("breakdetail").innerHTML =
        `<p><strong>${row.day}일 · ${cumulative ? "누적" : "당일"} 내역</strong></p><table>${cats.map(([k, l]) => `<tr><td>${l}</td><td>$${fmt(row[k] || 0)}</td></tr>`).join("")}<tr><td>표시 항목 합계</td><td>$${fmt(totals[i].net)}</td></tr></table>`;
    }
    detail(data.length - 1);
    document.getElementById("breakdown").onclick = (e) => {
      if (e.target.dataset.financeDay !== undefined) detail(+e.target.dataset.financeDay);
    };
    document.getElementById("breakdown").onkeydown = (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.dataset.financeDay !== undefined) {
        e.preventDefault();
        detail(+e.target.dataset.financeDay);
      }
    };
  }
  document.getElementById("breaklegend").addEventListener("change", (e) => {
    const k = e.target.dataset.finance;
    if (!k) return;
    if (e.target.checked) enabled.add(k);
    else enabled.delete(k);
    render(latest);
  });
  return { render, rows };
})();
