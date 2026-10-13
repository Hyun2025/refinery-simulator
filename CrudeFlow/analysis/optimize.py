"""Fixed-cargo, fixed arrival-profile LP. Perfect-information operational benchmark.
Replay each heuristic cargo's exact discharge profile, optimize feed and extra sales.
Comparison uses shared raw terminal acquisition value excluding unloading salvage.
"""

import json
from pathlib import Path
import numpy as np
from scipy.optimize import linprog
from scipy.sparse import lil_matrix

ROOT = Path(__file__).resolve().parent
Y = np.array([[0.25, 0.35, 0.40], [0.30, 0.45, 0.25], [0.35, 0.40, 0.25]])
PRICE = np.array([95, 105, 55])
CAP = np.array([5000, 15000, 30000])
LOAD = np.array([1.4, 1, 0.9])
OP = np.array([5, 4, 4])


def solve(r, o):
    # 60 days x (feed[3], raw closing[3], extra sales[3], product closing[3]), future sales 24x3
    daily_contracts = np.array([o.get("gasolineContract", 5000), o.get("dieselContract", 5000), 0])
    N = 60 * 12 + 72
    cost = np.zeros(N)
    bounds = [(0, None)] * N
    eq = []
    rhs = []
    ub = []
    lim = []
    initial = np.array([0, o["initialDays"] * 20000, 0.0])
    products = np.array([10000, 10000, 0.0])
    mix = np.array(r["mix"])
    sea = mix * 1e6
    rawcost = np.array([75 - o["discount"] + 3, 80.0, 81.0])
    rawcost[1] = (
        (initial[1] * 78 + mix[1] * 1e6 * 80) / (initial[1] + mix[1] * 1e6)
        if initial[1] + mix[1] * 1e6
        else 80
    )

    def row(items):
        z = {}
        for i, v in items:
            z[i] = z.get(i, 0) + v
        return z

    for t, d in enumerate(r["path"]):
        start = t * 12
        arrival = sea - np.array(d["sea"])
        sea = np.array(d["sea"])
        # each ship's arrival amounts are fixed from the common heuristic execution
        ub.append(row([(start + i, 1) for i in range(3)]))
        lim.append(20000)
        ub.append(row([(start + i, LOAD[i]) for i in range(3)]))
        lim.append(o["budget"])
        if t:
            ub.append(row([(start - 12 + 3 + i, 1) for i in range(3)]))
            lim.append(800000 - arrival.sum())
        else:
            if initial.sum() + arrival.sum() > 800000 + 1e-5:
                return None
        for i in range(3):
            items = [(start + 3 + i, 1), (start + i, 1)]
            if t:
                items.append((start - 12 + 3 + i, -1))
            eq.append(row(items))
            rhs.append(arrival[i] + (initial[i] if t == 0 else 0))
            cost[start + i] = OP[i]
            cost[start + 3 + i] = 0.015
            if t == 59:
                cost[start + 3 + i] -= rawcost[i]
        for j in range(3):
            contract = daily_contracts[j]
            items = [(start + 9 + j, 1), (start + 6 + j, 1)] + [
                (start + i, -Y[i, j]) for i in range(3)
            ]
            if t:
                items.append((start - 12 + 9 + j, -1))
            eq.append(row(items))
            rhs.append((products[j] if t == 0 else 0) - contract)
            # product tank must hold all production before same-day shipments
            items = [(start + i, Y[i, j]) for i in range(3)]
            if t:
                items.append((start - 12 + 9 + j, 1))
            ub.append(row(items))
            lim.append(120000 - (products[j] if t == 0 else 0))
            bounds[start + 6 + j] = (0, int(CAP[j]) if (t + 1) % 5 == 0 else 0)
            # same 1-day reserve, also on non-sales days redundant for extra sales=0
            if j < 2 and (t + 1) % 5 == 0 and t < 59:
                bounds[start + 9 + j] = (daily_contracts[j], 120000)
            else:
                bounds[start + 9 + j] = (0, 120000)
            cost[start + 9 + j] = 0.015
            cost[start + 6 + j] = 0.1 - d["prices"][j]
    # exact piecewise terminal liquidation: future capacity tiers, all residual products sold
    for j in range(3):
        eq.append(row([(720 + k * 3 + j, 1) for k in range(24)] + [(59 * 12 + 9 + j, -1)]))
        rhs.append(0)
        for k in range(24):
            bounds[720 + k * 3 + j] = (0, int(CAP[j]))
            cost[720 + k * 3 + j] = -PRICE[j] + 0.1 + (k + 1) * 5 * 0.015

    def matrix(rows):
        m = lil_matrix((len(rows), N))
        for i, rw in enumerate(rows):
            for j, v in rw.items():
                m[i, j] = v
        return m.tocsr()

    aeq, aub = matrix(eq), matrix(ub)
    b = np.array(rhs)
    u = np.array(lim)
    sol = linprog(cost, A_eq=aeq, b_eq=b, A_ub=aub, b_ub=u, bounds=bounds, method="highs")
    if not sol.success:
        if sol.status == 2:
            return None
        raise RuntimeError(sol.message)
    residual = max(
        float(np.max(np.abs(aeq @ sol.x - b))), float(np.max(np.maximum(aub @ sol.x - u, 0)))
    )
    if residual > 1e-4:
        raise AssertionError(residual)
    last = r["path"][-1]
    raw = np.dot(np.array(last["stocks"]) + np.array(last["sea"]), rawcost)
    heuristic = r["cashContribution"] + raw + r["liquidation"]["value"] - r["opening"]
    constant = (
        60 * np.dot(daily_contracts, PRICE - 0.1)
        - r["purchase"]
        - r["freight"]
        - r["unloading"]
        - r["opening"]
        + np.dot(sea, rawcost)
    )
    profit = constant - sol.fun
    if r["feasible"] and profit < heuristic - 0.01:
        raise AssertionError("LP below feasible common-objective heuristic")
    return {
        "mix": r["mix"],
        "lp_profit": float(profit),
        "heuristic_common_profit": float(heuristic),
        "heuristic_feasible": r["feasible"],
        "constraint_residual": residual,
        "throughput": float(sum(sol.x[t * 12 : t * 12 + 3].sum() for t in range(60))),
    }


def main():
    scenarios = json.loads((ROOT / "scenarios.json").read_text())
    reports = []
    for scenario in scenarios:
        solved = [solve(r, scenario["options"]) for r in scenario["results"]]
        ok = [r for r in solved if r]
        best = max(ok, key=lambda r: r["lp_profit"]) if ok else None
        common = [r for r in ok if r["heuristic_feasible"]]
        h = max(common, key=lambda r: r["heuristic_common_profit"]) if common else None
        reports.append(
            {
                "name": scenario["name"],
                "options": scenario["options"],
                "lp_feasible": len(ok),
                "heuristic_feasible": sum(r["feasible"] for r in scenario["results"]),
                "best_lp": best,
                "best_heuristic_common": h,
                "operational_gap": (
                    best["lp_profit"] - h["heuristic_common_profit"] if best and h else None
                ),
                "max_residual": max((r["constraint_residual"] for r in ok), default=0),
            }
        )
        print(scenario["name"], len(ok), best["mix"] if best else None, flush=True)
    (ROOT / "lp-results.json").write_text(json.dumps(reports, ensure_ascii=False, indent=2))
    (ROOT.parent / "lp-results.js").write_text(
        "window.CF_LP_RESULTS=" + json.dumps(reports, ensure_ascii=False) + ";"
    )


if __name__ == "__main__":
    main()
