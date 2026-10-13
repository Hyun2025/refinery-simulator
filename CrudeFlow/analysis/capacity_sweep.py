"""LP capacity sensitivity with each candidate's baseline discharge profile fixed.

Run after export.js. This is a saved experiment, not a live browser LP solver.
"""
import json
from pathlib import Path
from optimize import solve

ROOT = Path(__file__).resolve().parent


def main():
    baseline = json.loads((ROOT / "scenarios.json").read_text())[0]
    points = []
    for budget in range(12000, 30001, 1000):
        options = {**baseline["options"], "budget": budget}
        results = []
        for candidate in baseline["results"]:
            # The baseline heuristic is a valid comparison only if it fits this budget.
            replay = {**candidate, "feasible": candidate["feasible"] and all(
                day["load"] <= budget + 1e-6 for day in candidate["path"]
            )}
            result = solve(replay, options)
            if result:
                results.append(result)
        best = max(results, key=lambda r: r["lp_profit"]) if results else None
        points.append({"budget": budget, "feasible": len(results), "best": best,
                       "max_residual": max((r["constraint_residual"] for r in results), default=0)})
        print(budget, len(results), best["mix"] if best else None, flush=True)
    valid = [p["best"]["lp_profit"] for p in points if p["best"]]
    assert all(b >= a - .05 for a, b in zip(valid, valid[1:])), "Capacity relaxation reduced optimal profit"
    assert all(b["feasible"] >= a["feasible"] for a, b in zip(points, points[1:]))
    payload = {"options": baseline["options"], "points": points,
               "arrival_profile": "baseline-fixed-per-candidate", "candidate_count": 231}
    (ROOT / "capacity-results.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    (ROOT.parent / "capacity-results.js").write_text("window.CF_CAPACITY_RESULTS=" + json.dumps(payload) + ";\n")


if __name__ == "__main__":
    main()
