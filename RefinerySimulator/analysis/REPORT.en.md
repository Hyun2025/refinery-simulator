# Analytical report

## Executive summary
The cheapest crude is not necessarily the best purchase. Daily product commitments and processing limits must also be considered. Both the fixed operating policy and the LP choose 100% Y in the baseline experiment. Changing discounts, workload limits or extra-sale prices can change the LP recommendation and profit.

These are conditional results from a hypothetical model, not refinery purchase advice or a forecast. The main dashboard recalculates with user inputs. The LP table and capacity chart display separate, saved experiments.

## Decision and comparison
Allocate one million purchased barrels among X, Y and Z in 5% steps: 231 candidates. Supply 5,000 barrels of both gasoline and diesel every day for 60 days. A shortage on any day excludes a candidate from the recommendation.

The dashboard simulates a fixed operating policy. The LP keeps each candidate's arrival/discharge profile and optimizes daily feed and extra sales. Both purchase composition and operating assumptions affect the comparison.

## Five saved experiments
Baseline: 200,000 barrels of opening Y crude; 10,000 barrels each of gasoline and diesel; $5 X discount; no additional arrival delay; 20,000 daily workload units; flat prices. Each alternative changes only its named condition: discount $12, delay 15 days, workload 15,000, or Wave prices with 20% amplitude.

|Experiment|Feasible under fixed rules|Feasible under LP|LP mix X/Y/Z|Best-profit gap (USD)|
|---|---:|---:|---|---:|
|Baseline|172|201|0%/100%/0%|0.00|
|Larger X discount|172|201|70%/0%/30%|215,013.83|
|Delayed X arrival|144|200|0%/100%/0%|0.00|
|Lower workload limit|33|93|25%/45%/30%|105,427.11|
|Wave prices|172|201|10%/90%/0%|2,054,322.66|

The gap compares each method's best profit under a shared valuation; the winning mixes can differ. The main dashboard includes the remaining share of unloading cost in onshore crude inventory value. The LP comparison excludes that share from both methods. Do not directly subtract the main dashboard score from the LP score.

## Interpretation
- Baseline: LP increases feasible candidates but does not improve best profit. More options and higher profit are different outcomes.
- Larger discount: LP selects 70% X and 30% Z. The value of cheaper purchases depends on operations.
- Delayed arrival: more candidates meet contracts, but the best-profit gap is zero. Vessel allocation and unloading are not optimized.
- Lower workload: feasible candidates increase from 33 to 93, and best profit improves.
- Wave prices: the largest gap includes sales timing with perfect future-price knowledge. It is not evidence of predictable trading returns.

LP relaxes proportional blending and maximum feasible running together. This experiment does not isolate their individual effects.

## Capacity sensitivity
Keep baseline conditions and candidate-specific baseline arrivals fixed. Evaluate workload limits from 12,000 to 30,000 in steps of 1,000. The first feasible sampled limit is 18,000; the exact threshold between samples is not established.

At 18,000, LP chooses 30% X, 50% Y and 20% Z, with profit $5,040,475. From 20,000 through 30,000, the winner remains 100% Y and profit remains $6,331,525. Feasible candidates increase from 201 to 231. Increasing workload further does not improve the best profit in this baseline. The chart alone does not identify which other constraint is responsible.

## Validation and limits
Checks cover inventory, contracts, processing/workload/tank limits, price paths and financial reconciliation. LP checks cover equation residuals, constraint violations and dominance over feasible fixed-policy plans under the same objective. The educational chart's optimum was checked against an independent LP calculation.

UI connections were checked in a simulated browser. The user confirmed some deployed behavior, but comprehensive browser, screen-size and touch testing is not complete.

Yields, costs and workload coefficients are hypothetical. Quality compatibility, maintenance, minimum runs, ramp costs, demurrage and continuing contracts after day 60 are omitted. Next steps are yield/valuation sensitivity and separate tests of feed-mix and run-policy changes.
