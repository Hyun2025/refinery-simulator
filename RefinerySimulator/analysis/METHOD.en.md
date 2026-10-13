# Methodology and optimization

## Summary

Default contracts are 5,000 barrels/day each. Editing dashboard contracts recalculates the main analysis; saved LP/capacity experiments retain baseline contracts, and the educational example stays independent.

Purchasing and operating are distinct decisions. The dashboard compares 231 purchase mixes under fixed operating rules. The LP experiment also optimizes operations within each mix. The educational chart illustrates the idea with two crudes and one day.

## Questions
1. Can a purchase mix meet all 60 days of contracts within inventory and plant limits?
2. Which feasible mix has the highest modeled profit, and how do costs, sales and inventory values explain the difference?
3. With arrivals and valuation held comparable, how do operating choices change feasibility and best profit?

The third question examines selected assumptions; it does not establish validity in real refineries.

## Fixed operating policy
Enumerate all 231 mixes in 5% steps summing to 100%. Simulate each for 60 days. Feed in proportion to available onshore inventory and run as much as inventory, throughput, workload and product-tank limits allow. Recommend the highest-profit mix that meets every contract. If none qualify, display the minimum-shortage candidate for diagnosis, not as a recommendation. Optimality is limited to these candidates and rules.

## What LP decides
Linear programming finds the most profitable plan subject to specified constraints. A meal shop planning production with limited ingredients, cooking time and reserved orders is a useful analogy.

Fix a purchase mix and its arrival profile. Optimize daily crude feed, extra sales and inventories; repeat for all mixes and compare results. Procurement remains a discrete grid, while operating quantities are continuous. Fixed coefficients make workload, output and cost additive: 1,000 barrels each of X and Y consume 1,400 + 1,000 = 2,400 hypothetical workload units.

## Inventory equations
Closing crude = previous crude + discharged arrivals − feed.
Closing product = previous product + production − contract shipments − extra sales.

|Symbol|Meaning|
|---|---|
|i / j / t|Crude / product / day|
|q_it|Crude feed|
|R_it / I_jt|Closing crude / product inventory|
|a_it|Discharged arrivals|
|y_ij|Fixed product yield|
|s_jt|Extra sales|
|l_jk|Liquidation on future sales date k|

R_it = R_i,t−1 + a_it − q_it.
I_jt = I_j,t−1 + Σ_i(y_ij q_it) − contract_j − s_jt.
The sum adds production from all crude types.

## Constraints
All quantities are nonnegative. Daily feed is at most 20,000 barrels; weighted workload is at most the selected limit. Onshore crude before production is at most 800,000 barrels. Each product tank before contract shipment is at most 120,000 barrels. Daily gasoline and diesel contracts are 5,000 barrels each.

Extra sales occur every five days, capped at 5,000 gasoline, 15,000 diesel and 30,000 residue barrels. Before day 60, sale-day closing gasoline/diesel inventory must cover the next day's 5,000-barrel contracts. LP shares these constraints but may choose feed proportions and reduce daily runs.

## Profit and terminal value
Modeled profit = 60-day sales − purchase, freight, unloading, processing, storage and shipping costs + closing inventory value − opening inventory value.

After day 60, production and contracts end. Products are liquidated from day 65 at five-day intervals, within sales caps and at base prices, less future storage and shipping. The LP uses 24 opportunities, enough for a full gasoline tank.

Remaining crude is valued at acquisition cost plus freight. The dashboard also includes the allocated remaining unloading cost in onshore crude value. The common LP comparison excludes that value from both methods; actual unloading expenditure remains a cost. Subtracting opening value prevents existing assets from being counted as newly earned profit.

## Charts
The capacity chart is a saved experiment with baseline candidate-specific arrivals fixed. Lines connect samples, not newly solved intermediate values. Adjacent profit differences are interval comparisons, not shadow prices.

The two-variable chart is an independent teaching model. Its shaded region meets all displayed constraints. Its profit line connects equal-profit combinations. Moving the line toward higher profit until it last touches the region illustrates an optimum, not the actual solver trajectory.

## Validation and limits
SciPy linprog(method="highs") minimizes costs with negative coefficients for revenues and terminal values, then converts the result to profit. Checks cover equation residuals and constraint violations with tolerance 0.0001 in each row's units, including workload units. A feasible fixed-policy plan must not exceed its candidate's LP profit by more than $0.01 under the common objective.

LP assumes known future prices and arrivals. Candidate arrivals/discharge are fixed, so this is not integrated procurement/logistics optimization. Proportional blending and maximum-run policy are relaxed together, preventing attribution to either change alone. Results are not causal estimates or forecasts.

Reference: https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.linprog.html
