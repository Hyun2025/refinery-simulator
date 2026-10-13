const CFBench = (() => {
  function render(o, result) {
    const cheapest = CF.crude
      .map((v, i) => ({ i, cost: v.price + v.freight - (i === 0 ? o.discount : 0) }))
      .sort((a, b) => a.cost - b.cost)[0].i;
    const pure = [0, 0, 0];
    pure[cheapest] = 1;
    const strategies = [
      ["가격·운송비만 고려", CF.simulate(pure, o)],
      ["분산 구매 35/35/30", CF.simulate([0.35, 0.35, 0.3], o)],
      ["Y 100% 기준", CF.simulate([0, 1, 0], o)],
    ];
    if (result.best) strategies.push(["계약 충족 권고", result.best]);
    $("benchmarks").innerHTML = table(
      ["전략", "구매 구성비", "계약", "부족 (배럴)", "성과 USD", "평균 처리량"],
      strategies.map(([name, r]) => [
        name,
        mixLabel(r),
        r.feasible ? "충족" : "미충족",
        n(r.deficits[0] + r.deficits[1]),
        n(r.profit),
        n(r.total / 60),
      ]),
    );
    const best = result.best,
      y = strategies[2][1];
    $("insights").textContent = !best
      ? "현재 운영 규칙에서 계약을 충족하는 후보가 없습니다. 제품별 부족일과 재고를 확인하고 입고 일정·작업량 한도·초기 재고 조건을 점검해야 합니다."
      : best.mix.every((v, i) => Math.abs(v - y.mix[i]) < 1e-8)
        ? "현재 권고는 Y 100% 기준 전략과 같습니다. 이 조건과 운영 규칙에서는 혼합 구매로 더 높은 모형상 이익을 얻지 못했습니다. 다른 조건에서도 같은 결론이 유지되는지 선택 지도에서 확인하세요."
        : `권고 후보는 Y 100% 대비 모형상 이익이 $${n(best.profit - y.profit)} 만큼 다릅니다. ${y.feasible ? "두 전략 모두 계약을 충족합니다." : "Y 기준은 계약을 충족하지 못하므로 이익 차이만으로 대체성을 판단할 수 없습니다."} 할인 이익과 생산·재고 비용 차이를 손익 분해 탭에서 확인하세요.`;
    const records = window.CF_LP_RESULTS || [];
    const baseline = records[0]?.options || {};
    const gas = baseline.gasolineContract ?? 5000;
    const diesel = baseline.dieselContract ?? 5000;
    $("lpContractScope").textContent =
      `이 표의 ‘기준’과 다른 네 실험은 휘발유 ${n(gas)}배럴/일, 경유 ${n(diesel)}배럴/일 계약으로 미리 계산했습니다. 현재 기본 대시보드 계약은 휘발유 ${n(o.gasolineContract)}배럴/일, 경유 ${n(o.dieselContract)}배럴/일입니다. 계약 입력을 바꿔도 이 LP 표와 작업량 한도 실험은 다시 계산되지 않습니다.`;
    $("lpcomparison").innerHTML = table(
      [
        "고정 실험",
        "기존 규칙에서 계약을 지킨 조합 수",
        "LP에서 계약을 지킨 조합 수",
        "LP 권고",
        "LP 이익 (같은 평가 기준·달러)",
        "기존 규칙 이익 (같은 평가 기준·달러)",
        "이익 차이 (달러)",
      ],
      records.map((v) => [
        v.name,
        v.heuristic_feasible,
        v.lp_feasible,
        v.best_lp ? mixLabel(v.best_lp) : "불가능",
        v.best_lp ? n(v.best_lp.lp_profit) : "—",
        v.best_heuristic_common ? n(v.best_heuristic_common.heuristic_common_profit) : "—",
        v.operational_gap === null ? "—" : n(v.operational_gap),
      ]),
    );
  }
  return { render };
})();
