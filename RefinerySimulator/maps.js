/* Whole discrete procurement domain and conditional parameter slices. */
const CFMaps = (() => {
  const xy = (m) => [80 + 560 * m[1] + 280 * m[2], 430 - 350 * m[2]];
  const color = (v, lo, hi) => {
    const t = hi > lo ? Math.max(0, Math.min(1, (v - lo) / (hi - lo))) : 0.5;
    return `hsl(${220 - 180 * t} 65% ${65 - 20 * t}%)`;
  };
  function scaleLegend(lo, hi, title, mix = false) {
    const start = mix ? "hsl(220 65% 55%)" : color(lo, lo, hi);
    const end = mix ? "hsl(40 65% 55%)" : color(hi, lo, hi);
    const ticks = [0, 0.25, 0.5, 0.75, 1]
      .map((t) => {
        const v = lo + (hi - lo) * t;
        return `<span>${mix ? Math.round(v) + "%" : "$" + Math.round(v).toLocaleString()}</span>`;
      })
      .join("");
    return `<div class="color-scale" role="img" aria-label="${title}: ${lo}부터 ${hi}"><p class="note">${title}</p><div style="height:14px;border-radius:5px;background:linear-gradient(to right,${start},${end})"></div><div style="display:flex;justify-content:space-between;font-size:11px">${ticks}</div></div>`;
  }
  let epoch = 0;
  function ternary(result, selected) {
    const feasible = result.feasible,
      lo = feasible.length ? Math.min(...feasible.map((r) => r.profit)) : 0,
      hi = result.best?.profit || 0;
    let s =
      '<svg viewBox="0 0 760 520" aria-label="All purchase candidates map"><path d="M80 430L640 430L360 80Z" fill="#f0f4f6" stroke="#9cafb5"/>';
    for (let k = 1; k < 5; k++) {
      const f = k / 5;
      for (const pair of [
        [
          [1 - f, f, 0],
          [0, f, 1 - f],
        ],
        [
          [f, 1 - f, 0],
          [f, 0, 1 - f],
        ],
        [
          [1 - f, 0, f],
          [0, 1 - f, f],
        ],
      ]) {
        const a = xy(pair[0]),
          b = xy(pair[1]);
        s += `<path d="M${a}L${b}" stroke="#d3dfe3" fill="none"/>`;
      }
    }
    // Contours interpolate only triangles whose three evaluated vertices are feasible.
    if (document.getElementById("contours").checked && feasible.length > 1) {
      const lookup = new Map(
        result.all.map((r) => [
          r.mix
            .slice(0, 2)
            .map((w) => Math.round(w * 20))
            .join(","),
          r,
        ]),
      );
      function triangle(keys) {
        const r = keys.map((k) => lookup.get(k));
        if (r.some((v) => !v?.feasible)) return;
        for (let k = 1; k < 6; k++) {
          const level = lo + ((hi - lo) * k) / 6,
            hits = [];
          for (let j = 0; j < 3; j++) {
            const a = r[j],
              b = r[(j + 1) % 3];
            if (
              (a.profit < level && b.profit >= level) ||
              (b.profit < level && a.profit >= level)
            ) {
              const t = (level - a.profit) / (b.profit - a.profit),
                p = xy(a.mix),
                q = xy(b.mix);
              hits.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
            }
          }
          if (hits.length === 2)
            s += `<path d="M${hits[0]}L${hits[1]}" class="map-contour" stroke="var(--contour-ink, #183947)" stroke-opacity=".9" stroke-width="1.7" fill="none"><title>Interpolated contour $${Math.round(level)}</title></path>`;
        }
      }
      for (let x = 0; x < 20; x++)
        for (let y = 0; y < 20 - x; y++) {
          triangle([`${x},${y}`, `${x + 1},${y}`, `${x},${y + 1}`]);
          if (x + y <= 18) triangle([`${x + 1},${y}`, `${x + 1},${y + 1}`, `${x},${y + 1}`]);
        }
    }
    const tolerance = result.best ? Math.abs(result.best.profit) * 0.01 : 0;
    result.all.forEach((r, i) => {
      const [x, y] = xy(r.mix),
        near = r.feasible && hi - r.profit <= tolerance;
      const title = `${r.mix.map((w, j) => "XYZ"[j] + " " + Math.round(w * 100) + "%").join(" / ")} · ${r.feasible ? "계약 충족" : "계약 미충족"} · $${Math.round(r.profit).toLocaleString()} · 부족 ${Math.round(r.deficits[0] + r.deficits[1])}배럴`;
      s += `<circle data-candidate="${i}" cx="${x}" cy="${y}" r="${selected === i ? 9 : 6}" fill="${r.feasible ? color(r.profit, lo, hi) : "#c7ced2"}" stroke="${selected === i ? "#111" : near ? "#e12635" : "white"}" stroke-width="${near ? 3 : 1}" tabindex="0" role="button" aria-label="${title}" style="cursor:pointer"><title>${title}</title></circle>`;
    });
    result.ties.forEach((r) => {
      const [x, y] = xy(r.mix);
      s += `<text x="${x}" y="${y - 13}" text-anchor="middle" fill="#a77900" font-size="22" pointer-events="none">★</text>`;
    });
    s +=
      '<text x="80" y="460" text-anchor="middle">X 100%</text><text x="640" y="460" text-anchor="middle">Y 100%</text><text x="360" y="55" text-anchor="middle">Z 100%</text><text x="360" y="492" text-anchor="middle" font-size="13">Crude shares: 0–100% each (total 100%)</text></svg>';
    document.getElementById("mixmap").innerHTML =
      s +
      (feasible.length
        ? scaleLegend(lo, hi, "색상 기준: 계약을 지키는 후보의 모형상 이익 (USD)")
        : "");
    document.getElementById("maplegend").innerHTML =
      `파랑 → 노랑: 파랑색일수록 이익이 낮고, 초록색은 중간, 노랑색일수록 이익이 높음을 나타냅니다.<br> <!--($${Math.round(lo).toLocaleString()} ~ $${Math.round(hi).toLocaleString()})-->
      회색: 계약 미충족<br> 
      ★: 이산 후보 최적<br>
      붉은색 테두리: 최고 성과 대비 차이 ≤ |최고 성과|의 1%.<br>
      등고선은 보간 참고선이며 새로운 후보를 계산한 결과가 아닙니다.`;
  }
  async function heatmap(o, mode) {
    const token = ++epoch,
      rows = [];
    const note = document.getElementById("heatstatus");
    for (let delay = 0; delay <= 20; delay += 2) {
      const row = [];
      for (let discount = 0; discount <= 15; discount++) {
        const r = CF.evaluate({ ...o, delay, discount });
        row.push({ delay, discount, best: r.best, count: r.feasible.length });
      }
      rows.push(row);
      if (token !== epoch) return;
      note.textContent = `계산 중 ${rows.length}/11행 · 각 칸마다 231개 후보 비교`;
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (token !== epoch) return;
    }
    const profits = rows
        .flat()
        .filter((v) => v.best)
        .map((v) => v.best.profit),
      lo = profits.length ? Math.min(...profits) : 0,
      hi = profits.length ? Math.max(...profits) : 0;
    let s = '<svg viewBox="0 0 820 420" aria-label="할인폭 입고지연 조건 지도">';
    rows.forEach((row, j) =>
      row.forEach((v, i) => {
        const x = 70 + i * 43,
          y = 25 + j * 28;
        let fill = "#ced4d8";
        if (v.best)
          fill =
            mode === "profit"
              ? color(v.best.profit, lo, hi)
              : `hsl(${220 - v.best.mix[0] * 180} 65% 55%)`;
        const label = v.best
          ? `${v.best.mix.map((w, k) => "XYZ"[k] + " " + Math.round(w * 100) + "%").join(" / ")} · $${Math.round(v.best.profit).toLocaleString()} · 충족 ${v.count}/231`
          : "충족 가능한 조합 없음";
        s += `<rect data-discount="${v.discount}" data-delay="${v.delay}" x="${x}" y="${y}" width="41" height="26" fill="${fill}" tabindex="0" role="button" style="cursor:pointer" aria-label="할인 ${v.discount}달러, 지연 ${v.delay}일: ${label}"><title>할인 ${v.discount}달러 · 지연 ${v.delay}일 · ${label}</title></rect>`;
        if (mode === "mix" && v.best)
          s += `<text pointer-events="none" x="${x + 20}" y="${y + 17}" text-anchor="middle" font-size="10" fill="white">${Math.round(v.best.mix[0] * 100)}</text>`;
      }),
    );
    for (let j = 0; j <= 10; j++)
      s += `<text x="58" y="${43 + j * 28}" text-anchor="end" font-size="12">${j * 2}</text>`;
    for (let i = 0; i <= 15; i++)
      s += `<text x="${90 + i * 43}" y="354" text-anchor="middle" font-size="12">${i}</text>`;
    s +=
      '<text x="410" y="386" text-anchor="middle">X축: X 추가 할인 (USD/배럴)</text><text transform="translate(18 180) rotate(-90)" text-anchor="middle">Y축: X 입고 지연 (일)</text></svg>';
    document.getElementById("heatmap").innerHTML =
      s +
      (profits.length
        ? mode === "profit"
          ? scaleLegend(lo, hi, "색상 기준: 각 조건의 최고 모형상 이익 (USD)")
          : scaleLegend(0, 100, "색상 기준: 추천 구매 조합의 X 비율", true)
        : "");
    note.textContent = `176개 조건 × 231개 후보 = 40,656회 비교 완료. ${mode === "profit" ? `색: 각 조건의 최고 성과 ($${Math.round(lo).toLocaleString()}~$${Math.round(hi).toLocaleString()})` : "색과 숫자: 권고 조합의 X 비율 (0~100%). 전체 XYZ 비율은 칸을 클릭하거나 마우스를 올려 확인하세요."} 회색: 계약 충족 불가. 부하·초기 재고·가격 경로는 현재 UI 값으로 고정됩니다.`;
  }
  function cancel() {
    epoch++;
  }
  return { ternary, heatmap, cancel, xy };
})();
