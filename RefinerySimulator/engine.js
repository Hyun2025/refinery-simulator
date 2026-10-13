/* CrudeFlow B: deterministic scenario experiment, not an industrial optimizer. */
const CF = (() => {
  const crude = [
    { price: 75, freight: 3, op: 5, yield: [0.25, 0.35, 0.4], load: 1.4 },
    { price: 78, freight: 2, op: 4, yield: [0.3, 0.45, 0.25], load: 1 },
    { price: 80, freight: 1, op: 4, yield: [0.35, 0.4, 0.25], load: 0.9 },
  ];
  const base = [95, 105, 55],
    caps = [5000, 15000, 30000];
  const defaults = {
    gasolineContract: 5000,
    dieselContract: 5000,
    discount: 5,
    delay: 0,
    initialDays: 10,
    budget: 20000,
    amplitude: 0.2,
    scenario: "flat",
  };
  function factor(day, o) {
    const u = (day - 1) / 59;
    if (o.scenario === "custom") {
      const points = o.points || [
        { day: 20, value: 1 },
        { day: 40, value: 1 },
      ];
      if (
        points.length !== 2 ||
        points[0].day <= 1 ||
        points[1].day >= 60 ||
        points[0].day >= points[1].day ||
        points.some((p) => p.value < 0.5 || p.value > 1.5)
      )
        throw Error("Invalid price handles");
      const anchors = [{ day: 1, value: 1 }, ...points, { day: 60, value: 1 }];
      const d = Math.max(1, Math.min(60, day));
      let i = 0;
      while (i < 2 && d > anchors[i + 1].day) i++;
      const a = anchors[i],
        b = anchors[i + 1],
        t = (d - a.day) / (b.day - a.day);
      // Piecewise cubic smoothstep: passes through handles without overshooting.
      const smooth = t * t * (3 - 2 * t);
      return a.value + (b.value - a.value) * smooth;
    }
    if (o.scenario === "quadratic") return 1 + 4 * o.amplitude * u * (1 - u);
    if (o.scenario === "wave")
      return 1 + 6 * Math.sqrt(3) * o.amplitude * u * (1 - u) * (2 * u - 1);
    return 1;
  }
  function terminalProducts(q) {
    // First liquidation opportunity is day 65; contracts ended on day 60.
    let value = 0,
      holding = 0,
      shipping = 0,
      periods = 0,
      stock = q.slice();
    while (stock.some((v) => v > 1e-7)) {
      holding += stock.reduce((a, b) => a + b, 0) * 5 * 0.015;
      for (let j = 0; j < 3; j++) {
        const sold = Math.min(stock[j], caps[j]);
        stock[j] -= sold;
        value += sold * base[j];
        shipping += sold * 0.1;
      }
      periods++;
      if (periods > 10000) throw Error("Liquidation failed");
    }
    return { value: value - holding - shipping, holding, shipping, days: periods * 5 };
  }
  function simulate(mix, options = {}) {
    const o = { ...defaults, ...options };
    if (
      mix.length !== 3 ||
      mix.some((x) => x < 0) ||
      Math.abs(mix.reduce((a, b) => a + b, 0) - 1) > 1e-8
    )
      throw Error("Invalid mix");
    if (o.amplitude < 0 || o.amplitude >= 1 || o.budget <= 0) throw Error("Invalid settings");
    const dailyContracts = [o.gasolineContract, o.dieselContract, 0];
    if (dailyContracts.some((v) => !Number.isInteger(v) || v < 0 || v > 120000))
      throw Error("Invalid daily contract");
    let stocks = [0, o.initialDays * 20000, 0],
      sea = mix.map((w) => w * 1e6),
      products = [10000, 10000, 0];
    let revenue = 0,
      processing = 0,
      holding = 0,
      unloading = 0,
      shipping = 0,
      total = 0;
    let deficits = [0, 0],
      shortageDays = 0,
      path = [],
      opening = stocks[1] * 78 + 10000 * 95 + 10000 * 105;
    const purchase = mix.reduce(
      (s, w, i) => s + w * 1e6 * (crude[i].price - (i === 0 ? o.discount : 0)),
      0,
    );
    const freight = mix.reduce((s, w, i) => s + w * 1e6 * crude[i].freight, 0);
    // Y inventory uses weighted acquisition cost including opening stock.
    const unitCost = crude.map((c, i) => c.price - (i === 0 ? o.discount : 0) + c.freight);
    const totalY = stocks[1] + mix[1] * 1e6;
    // No Y inventory means no Y asset to value: do not invent stock to avoid 0/0.
    unitCost[1] = totalY > 0 ? (stocks[1] * 78 + mix[1] * 1e6 * 80) / totalY : 0;
    const landedExtra = [0, 0, 0];
    for (let day = 1; day <= 60; day++) {
      const beforeCosts = { processing, holding, unloading, shipping, revenue };
      const eligible = sea.map((v, i) => (day >= 7 + (i === 0 ? o.delay : 0) ? v : 0));
      const pending = eligible.reduce((a, b) => a + b, 0);
      const room = Math.max(0, 800000 - stocks.reduce((a, b) => a + b, 0));
      const discharge = Math.min(pending, 100000, room);
      if (pending > 0)
        for (let i = 0; i < 3; i++) {
          const q = (discharge * eligible[i]) / pending;
          sea[i] -= q;
          stocks[i] += q;
          unloading += q * 0.1;
          landedExtra[i] += q * 0.1;
        }
      const available = stocks.reduce((a, b) => a + b, 0);
      const ratio = available > 0 ? stocks.map((v) => v / available) : [0, 0, 0];
      const yields = base.map((_, j) => ratio.reduce((s, w, i) => s + w * crude[i].yield[j], 0));
      const load = ratio.reduce((s, w, i) => s + w * crude[i].load, 0);
      let run = available > 0 ? Math.min(20000, available, o.budget / load) : 0;
      for (let j = 0; j < 3; j++)
        if (yields[j] > 0) run = Math.min(run, Math.max(0, 120000 - products[j]) / yields[j]);
      for (let i = 0; i < 3; i++) {
        stocks[i] -= run * ratio[i];
        processing += run * ratio[i] * crude[i].op;
      }
      for (let j = 0; j < 3; j++) products[j] += run * yields[j];
      const peak = products.slice(),
        contract = [0, 0, 0],
        extra = [0, 0, 0],
        deficit = [0, 0];
      for (let j = 0; j < 2; j++) {
        contract[j] = Math.min(dailyContracts[j], products[j]);
        products[j] -= contract[j];
        deficit[j] = dailyContracts[j] - contract[j];
        deficits[j] += deficit[j];
        revenue += contract[j] * base[j];
        shipping += contract[j] * 0.1;
      }
      if (deficit.some((v) => v > 1e-6)) shortageDays++;
      if (day % 5 === 0)
        for (let j = 0; j < 3; j++) {
          const reserve = j < 2 && day < 60 ? dailyContracts[j] : 0;
          extra[j] = Math.min(caps[j], Math.max(0, products[j] - reserve));
          products[j] -= extra[j];
          revenue += extra[j] * base[j] * factor(day, o);
          shipping += extra[j] * 0.1;
        }
      holding += (stocks.reduce((a, b) => a + b, 0) + products.reduce((a, b) => a + b, 0)) * 0.015;
      total += run;
      const contractRevenue = contract.reduce((s, q, j) => s + q * base[j], 0);
      const dailyFinance = {
        contract: contractRevenue,
        extra: revenue - beforeCosts.revenue - contractRevenue,
        processing: -(processing - beforeCosts.processing),
        holding: -(holding - beforeCosts.holding),
        unloading: -(unloading - beforeCosts.unloading),
        shipping: -(shipping - beforeCosts.shipping),
      };
      path.push({
        finance: dailyFinance,
        day,
        run,
        load: run * load,
        stocks: stocks.slice(),
        sea: sea.slice(),
        products: products.slice(),
        peak,
        contract,
        extra,
        deficit,
        ratio,
        prices: base.map((p) => p * factor(day, o)),
      });
    }
    const liquidation = terminalProducts(products);
    // Unprocessed cargo valued at actual acquisition cost; only landed stock has unloading cost.
    const rawTerminal =
      stocks.reduce((s, v, i) => s + v * unitCost[i], 0) +
      sea.reduce((s, v, i) => s + v * unitCost[i], 0);
    // Remaining share of incurred unloading cost, using proportional drawdown accounting.
    // Track it exactly below from daily discharge and proportional depletion.
    let remainingUnload = [0, 0, 0],
      prev = [0, o.initialDays * 20000, 0],
      prevSea = mix.map((w) => w * 1e6);
    for (const row of path)
      for (let i = 0; i < 3; i++) {
        const arrived = prevSea[i] - row.sea[i];
        const before = prev[i] + arrived;
        remainingUnload[i] =
          (remainingUnload[i] + arrived * 0.1) * (before > 0 ? row.stocks[i] / before : 0);
        prev[i] = row.stocks[i];
        prevSea[i] = row.sea[i];
      }
    const terminal = rawTerminal + remainingUnload.reduce((a, b) => a + b, 0) + liquidation.value;
    const cashContribution =
      revenue - purchase - freight - processing - holding - unloading - shipping;
    return {
      mix,
      contracts: dailyContracts,
      feasible: deficits.every((v) => v < 1e-6),
      deficits,
      shortageDays,
      total,
      revenue,
      purchase,
      freight,
      processing,
      holding,
      unloading,
      shipping,
      opening,
      terminal,
      liquidation,
      cashContribution,
      profit: cashContribution + terminal - opening,
      path,
    };
  }
  function candidates() {
    const a = [];
    for (let x = 0; x <= 20; x++)
      for (let y = 0; y <= 20 - x; y++) a.push([x / 20, y / 20, (20 - x - y) / 20]);
    return a;
  }
  function evaluate(o) {
    const all = candidates().map((m) => simulate(m, o));
    const feasible = all.filter((r) => r.feasible).sort((a, b) => b.profit - a.profit);
    const fallback = all
      .slice()
      .sort(
        (a, b) =>
          a.deficits.reduce((s, v) => s + v, 0) - b.deficits.reduce((s, v) => s + v, 0) ||
          b.profit - a.profit,
      )[0];
    return {
      all,
      feasible,
      best: feasible[0] || null,
      diagnostic: fallback,
      ties: feasible.length
        ? feasible.filter((r) => Math.abs(r.profit - feasible[0].profit) <= 1)
        : [],
    };
  }
  return { crude, base, defaults, factor, terminalProducts, simulate, candidates, evaluate };
})();
if (typeof module !== "undefined") module.exports = CF;
