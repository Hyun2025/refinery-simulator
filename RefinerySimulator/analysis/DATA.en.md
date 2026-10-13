# Data and assumptions

## Summary

Default contracts are 5,000 barrels/day each. Editing dashboard contracts recalculates the main analysis; saved LP/capacity experiments retain baseline contracts, and the educational example stays independent.

The data are simulated operating records produced from explicit assumptions, not observations from real refineries. Inputs have defined roles and units but are not calibrated plant coefficients.

## Observation unit
One row records a day of production, sales, inventories and costs for a purchase mix under a chosen scenario. Sixty days determine a candidate's profit and contract feasibility. Scenarios are designed comparisons, not random samples with occurrence probabilities.

## Inputs and units
|Input|Setting|
|---|---|
|Purchase|One million barrels; X/Y/Z shares in 5% steps|
|Contracts|60 days; 5,000 barrels/day each of gasoline and diesel|
|Opening crude|Y only; one slider day denotes 20,000 barrels|
|Opening products|10,000 barrels each of gasoline and diesel|
|X/Y/Z purchase prices|75−X discount / 78 / 80 USD/barrel|
|X/Y/Z freight|3 / 2 / 1 USD/barrel|
|X/Y/Z processing|5 / 4 / 4 USD/barrel|
|Gasoline/diesel/residue yields|X 25/35/40%; Y 30/45/25%; Z 35/40/25%|
|X/Y/Z workload|1.4 / 1 / 0.9 hypothetical units/barrel|
|Extra-sale base prices|95 / 105 / 55 USD/barrel|

Discharge may start on day 7; only X receives extra delay. Actual arrivals reflect the 100,000-barrel daily discharge cap and crude-tank space. The dashboard assumptions explain the complete sequence and costs.

## Prices and valuation
Paths affect extra-sale prices only. Purchase and contract prices stay fixed. All products share a relative multiplier; endpoints return to base prices. Custom handles keep date order and stay within 50–150% of base prices.

Purchase expenditure is recorded at day 0. Large values are expected, not outliers to remove. Opening/closing inventory values are separate from cash sales. Yields summing to 100% implement a synthetic volume allocation, not evidence of real refinery mass conservation.

## Missing versus zero
Zero inventory and zero shares are valid. An infeasible LP is stored as null and displayed as unavailable, not assigned zero profit. Missing results and genuine zeros have different meanings.

## Sources and limits
Planning literature informs the procurement/production/inventory structure. It does not validate these coefficients or prove that companies use these rules. No measured assays or market-price sample is used. Generated rows do not establish statistical significance or causal effects.

Planning reference: https://egon.cheme.cmu.edu/Papers/Su_IntegratedRefineryPlanning-2.pdf
Solver reference: https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.linprog.html
