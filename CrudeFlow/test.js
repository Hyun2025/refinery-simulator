const assert = require("node:assert/strict");
const c = require("./engine");
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-5, `${a} != ${b}`);
assert.equal(c.candidates().length, 231);
for (const scenario of ["flat", "quadratic", "wave"]) {
  near(c.factor(1, { scenario, amplitude: 0.2 }), 1);
  near(c.factor(60, { scenario, amplitude: 0.2 }), 1);
  for (const r of c.evaluate({ scenario }).all) {
    let processed = 0,
      sales = [0, 0, 0],
      produced = [0, 0, 0];
    for (const day of r.path) {
      processed += day.run;
      day.stocks.forEach((q) => assert.ok(q >= -1e-6));
      assert.ok(day.stocks.reduce((s, v) => s + v, 0) <= 800000 + 1e-6);
      assert.ok(day.run <= 20000 + 1e-6 && day.load <= 20000 + 1e-6);
      for (let j = 0; j < 3; j++) {
        assert.ok(day.peak[j] <= 120000 + 1e-6 && day.products[j] >= -1e-6);
        produced[j] += day.run * day.ratio.reduce((s, w, i) => s + w * c.crude[i].yield[j], 0);
        sales[j] += day.contract[j] + day.extra[j];
        if (day.day % 5 !== 0) near(day.extra[j], 0);
        if (j < 2 && day.extra[j] > 0 && day.day < 60) assert.ok(day.products[j] >= 5000 - 1e-6);
      }
    }
    const last = r.path.at(-1);
    near(
      processed + last.stocks.reduce((s, v) => s + v, 0) + last.sea.reduce((s, v) => s + v, 0),
      1200000,
    );
    for (let j = 0; j < 3; j++)
      near((j < 2 ? 10000 : 0) + produced[j], sales[j] + last.products[j]);
    near(
      r.profit,
      r.revenue -
        r.purchase -
        r.freight -
        r.processing -
        r.holding -
        r.unloading -
        r.shipping +
        r.terminal -
        r.opening,
    );
  }
}
assert.equal(c.evaluate({ initialDays: 0 }).best, null);
assert.ok(c.evaluate({ budget: 10000 }).feasible.length === 0);
const liquidation = c.terminalProducts([0, 30000, 0]);
near(liquidation.days, 10);
near(liquidation.holding, 3375);
near(liquidation.shipping, 3000);
console.log(
  "PASS: 693 candidate paths; inventory, mass allocation, limits, contract reserves, infeasibility, price endpoints, terminal liquidation and profit reconciliation",
);
for (const points of [
  [
    { day: 20, value: 1 },
    { day: 40, value: 1 },
  ],
  [
    { day: 15, value: 0.5 },
    { day: 45, value: 1.5 },
  ],
  [
    { day: 2, value: 1.5 },
    { day: 3, value: 0.5 },
  ],
]) {
  const o = { scenario: "custom", points };
  near(c.factor(1, o), 1);
  near(c.factor(60, o), 1);
  for (const p of points) near(c.factor(p.day, o), p.value);
  for (let day = 1; day <= 60; day += 0.1) {
    const v = c.factor(day, o);
    assert.ok(v >= 0.5 - 1e-8 && v <= 1.5 + 1e-8);
  }
  const custom = c.evaluate(o);
  assert.equal(custom.all.length, 231);
}
const flat = c.evaluate({ scenario: "flat" }),
  custom = c.evaluate({
    scenario: "custom",
    points: [
      { day: 20, value: 1 },
      { day: 40, value: 1 },
    ],
  });
near(flat.best.profit, custom.best.profit);
console.log(
  "PASS: custom handles, endpoints, no overshoot, flat equivalence and 693 custom candidates",
);
for (const r of c.evaluate({ scenario: "wave" }).all) {
  const sum = (k) => r.path.reduce((s, row) => s + row.finance[k], 0);
  near(sum("contract") + sum("extra"), r.revenue);
  for (const k of ["processing", "holding", "unloading", "shipping"]) near(sum(k), -r[k]);
  const daily = r.path.reduce(
    (s, row) => s + Object.values(row.finance).reduce((a, b) => a + b, 0),
    0,
  );
  near(daily - r.purchase - r.freight - r.opening + r.terminal, r.profit);
}
console.log("PASS: daily financial ledger reconciles to component totals and final profit");

// Zero opening Y and zero Y purchases must not introduce an undefined asset price.
for (const initialDays of [0, 1, 10, 20]) {
  const evaluated = c.evaluate({ initialDays });
  for (const r of evaluated.all) {
    for (const key of ["profit", "terminal", "opening", "revenue", "cashContribution"])
      assert(Number.isFinite(r[key]), `Non-finite ${key} at ${initialDays} opening days: ${r.mix}`);
  }
}
console.log(
  "PASS: all 231 candidates have finite financial results at opening days 0, 1, 10 and 20",
);

// Contract quantities affect shipment, shortage and next-day reserve independently.
for (const [gasolineContract, dieselContract] of [
  [6000, 4000],
  [0, 5000],
  [0, 0],
  [120000, 120000],
]) {
  const result = c.evaluate({ gasolineContract, dieselContract });
  for (const r of result.all) {
    near(r.contracts[0], gasolineContract);
    near(r.contracts[1], dieselContract);
    for (const j of [0, 1]) {
      near(r.path.reduce((sum, d) => sum + d.contract[j], 0) + r.deficits[j], 60 * r.contracts[j]);
      for (const day of r.path) {
        assert(day.contract[j] <= r.contracts[j] + 1e-6);
        if (day.extra[j] > 0 && day.day < 60) assert(day.products[j] >= r.contracts[j] - 1e-6);
      }
    }
    assert(Number.isFinite(r.profit));
  }
  if (gasolineContract === 0 && dieselContract === 0) assert.equal(result.feasible.length, 231);
  if (gasolineContract === 120000) assert.equal(result.feasible.length, 0);
}
for (const invalid of [-1, 0.5, 120001, NaN])
  assert.throws(() => c.simulate([0, 1, 0], { gasolineContract: invalid }));
console.log(
  "PASS: editable contracts, independent product shortages/reserves, zero contracts and invalid inputs",
);
