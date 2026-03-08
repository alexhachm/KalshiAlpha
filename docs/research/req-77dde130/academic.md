# req-77dde130: Academic/Professional Evidence for Decision-Support UI Features

## Scope and framing
This note focuses on interface-level capabilities that can improve trading/forecasting decision quality without requiring heavy predictive modeling. Evidence is drawn from peer-reviewed finance/decision papers and professional execution/risk standards.

## Evidence matrix (source -> UI capability)

| Source | Evidence (condensed) | UI-translatable capability |
|---|---|---|
| Odean (1998), *Journal of Finance* | Retail investors realize gains more readily than losses (disposition effect), which degrades decision quality. | Add a **position-exit diagnostic**: show gain/loss realization bias stats (user-level PGR/PLR style ratios), tax impact, and counterfactual outcomes before order submit. |
| Barber & Odean (2000), *Journal of Finance* | High-turnover households underperform lower-turnover households after costs. | Add a **turnover cost guardrail**: pre-trade panel estimates annualized drag from current turnover + fees/slippage and compares against user baseline. |
| Biais et al. (2005), *Review of Financial Studies* | Experimental evidence links behavioral biases (e.g., overconfidence/miscalibration) to trading errors and lower outcomes. | Add a **confidence discipline widget**: require confidence entry for discretionary trades and track calibration over time. |
| Benartzi & Thaler (1995), *QJE* | Myopic loss aversion helps explain conservative risk-taking when outcomes are evaluated too frequently. | Add **evaluation-horizon controls**: default portfolio performance views to weekly/monthly windows, with opt-in intraday P/L notifications. |
| Thaler et al. (1997), *QJE* | More frequent feedback can reduce risk-taking (myopia + loss aversion effect). | Add **feedback-frequency presets**: “execution mode” (low-frequency P/L interruptions) vs “monitor mode” (high-frequency). |
| Bertsimas & Lo (1998), *Journal of Financial Markets* | Execution cost is a dynamic control problem balancing impact and timing risk. | Add a **pre-trade execution planner**: simple slider/curve for urgency vs expected cost with transparent assumptions. |
| Almgren & Chriss (2000), *Journal of Risk* | Formal tradeoff between market impact and volatility risk yields an efficient frontier of execution choices. | Add an **execution frontier card**: visualize expected shortfall vs risk for several schedule choices (fast/neutral/passive). |
| SEC Rule 605 (17 CFR 242.605) | Requires standardized execution-quality disclosures (effective spread, speed, fill quality) for market centers. | Add a **venue quality panel**: expose normalized 605 metrics in routing/venue settings and post-trade review. |
| SEC Rule 606 (17 CFR 242.606) | Requires broker order-routing disclosures and material routing relationships. | Add a **routing transparency view**: show where orders are sent, why, and conflicts/arrangements in plain language. |
| FINRA Rule 5310 (Best Execution) | Requires reasonable diligence to obtain most favorable terms under prevailing market conditions. | Add a **best-ex check checklist**: before submit, show price improvement odds, spread, liquidity, and alternate venue snapshot. |
| Brier (1950), *Monthly Weather Review* | Proper scoring rules (Brier score) quantify forecast probability quality (calibration + discrimination). | Add a **probability scorecard**: for any discretionary probability estimate, compute and display rolling Brier score by market/regime. |
| Mellers et al. (2014), *PNAS* | Forecasting accuracy improves with structured methods/training and disciplined aggregation. | Add a **decision journal + post-mortem loop**: prompt rationale at entry, then score outcome and calibration after resolution. |
| Gigerenzer & Hoffrage (1995), *Psychological Review* | Natural-frequency framing improves probabilistic reasoning vs abstract percentages. | Add **frequency-based risk display**: show “X out of 100 similar cases” alongside percentages for key probabilities. |

## Prioritized recommendations (directly actionable)

1. **Pre-trade Decision Card (highest leverage)**
   - Show expected edge, fees, expected slippage, and implementation-shortfall estimate in one pane.
   - Include confidence input and a short rationale field (journal entry).
2. **Execution Quality and Routing Transparency**
   - Provide venue metrics (605-style), routing disclosures (606-style), and a best-ex checklist aligned to FINRA 5310.
   - Keep this visible both pre-trade and in post-trade attribution.
3. **Behavioral Guardrails**
   - Add turnover-drag alerts and disposition-bias diagnostics in exits.
   - Use soft friction (warning + one-click override), not hard blocks.
4. **Feedback Frequency Controls**
   - Default to lower-frequency performance evaluation to reduce myopic overreaction.
   - Offer user-controlled monitoring profiles for different workflows.
5. **Calibration Loop**
   - Score probability judgments with Brier; report by confidence bucket and regime.
   - Add monthly calibration review prompts and simple corrective suggestions.
6. **Natural-Frequency Probability Presentation**
   - Pair percentages with base-rate counts from historical cohorts to improve interpretability.

## Implementation notes (low model complexity)
- Use transparent arithmetic and historical lookup tables before introducing predictive models.
- Prefer debiased defaults (e.g., lower-frequency P/L interruptions, mandatory cost display) with explicit override.
- Log feature usage and outcomes to evaluate whether each UI element reduces avoidable errors.

## Sources

1. Terrance Odean (1998). *Are Investors Reluctant to Realize Their Losses?* Journal of Finance. PDF: https://faculty.haas.berkeley.edu/odean/papers/disposition%20effect%201998.pdf
2. Brad Barber & Terrance Odean (2000). *Trading Is Hazardous to Your Wealth.* Journal of Finance. PDF: https://faculty.haas.berkeley.edu/odean/papers%20current%20versions/Individual_Investor_Performance_Final.pdf
3. Bruno Biais, Denis Hilton, Karine Mazurier, Sebastien Pouget (2005). *Judgemental Biases in the Stock-Market: Experimental Evidence.* Review of Financial Studies. https://academic.oup.com/rfs/article-abstract/18/1/287/1599897
4. Shlomo Benartzi & Richard Thaler (1995). *Myopic Loss Aversion and the Equity Premium Puzzle.* QJE. https://academic.oup.com/qje/article-abstract/110/1/73/1914975
5. Richard Thaler, Amos Tversky, Daniel Kahneman, Alan Schwartz (1997). *The Effect of Myopia and Loss Aversion on Risk Taking.* QJE. https://academic.oup.com/qje/article-abstract/112/2/647/1921169
6. Dimitris Bertsimas & Andrew Lo (1998). *Optimal Control of Execution Costs.* Journal of Financial Markets. PDF: https://dspace.mit.edu/bitstream/handle/1721.1/2715/SWP-3989-34781522.pdf
7. Robert Almgren & Neil Chriss (2000). *Optimal Execution of Portfolio Transactions.* Journal of Risk. (record) https://econpapers.repec.org/article/rskjourn4/2161159.htm
8. SEC Rule 605 (17 CFR 242.605): https://www.law.cornell.edu/cfr/text/17/242.605
9. SEC Rule 606 (17 CFR 242.606): https://www.law.cornell.edu/cfr/text/17/242.606
10. FINRA Rule 5310 (Best Execution and Interpositioning): https://www.finra.org/rules-guidance/rulebooks/finra-rules/5310
11. Glenn W. Brier (1950). *Verification of Forecasts Expressed in Terms of Probability.* Monthly Weather Review. PDF: https://www.stat.unc.edu/postscript/rs/brier.pdf
12. Barbara Mellers et al. (2014). *Psychological Strategies for Winning a Geopolitical Forecasting Tournament.* PNAS. https://www.pnas.org/doi/10.1073/pnas.1400294111
13. Gerd Gigerenzer & Ulrich Hoffrage (1995). *How to Improve Bayesian Reasoning Without Instruction: Frequency Formats.* Psychological Review. PDF: https://www.mit.edu/~6.s085/papers/p745-gigerenzer.pdf

