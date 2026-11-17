# Strategy and local validation

The bot buys with 90% of equity when the close gains at least 1.4% over three
bars or falls at least 0.9% below the trailing 60-bar average. It exits at 1.2%
above the position's fee-inclusive cost, 0.8% below cost, or after 120 bars,
then waits 15 bars. Orders cap adverse slippage at 250 bps. It uses only the
observed bars and account, with no clock, environment, network or external files.

The plain starting family used a 1% surge, 1.5% dip, 70% size, 2% profit,
0.4% stop and 60-bar holding limit. It lost $4.602322 on this dev window.
A parameter sweep compared surge, dip, sizing, exits and holding periods;
the final selection favored a profitable neighborhood rather than maximum PnL.

The actual packaged baseline programs and entry were driven through the line
protocol by an external Python evaluator. Their captured replies were replayed
through the kit's unmodified BarsEngine and scoreBarsActionLog. This exactly
cross-checks simulator results against the published harness's integer fills
and score. The grade-local CLI itself could not run: its child Git process
failed with spawnSync git EPERM. This is not an official grade-local result.
Evaluation scripts and logs are outside this repository.

| Bot | Net PnL (USDC) | Filled orders | Win rate | Max drawdown | Fees |
| --- | ---: | ---: | ---: | ---: | ---: |
| Final | 9.779339 | 2 | 100% | 0.5166304% | 0.724058 |
| buy-and-hold | 1.067187 | 1 | 100% | 2.1189434% | 0.800588 |
| hold-cash | 0 | 0 | n/a | 0% | 0 |
| momentum | 2.445627 | 1 | 100% | 2.1189434% | 0.801139 |
| ema-cross | -106.214838 | 68 | 8.8235294% | 10.9581067% | 25.737382 |
| adx-momentum | -32.655586 | 26 | 23.0769230% | 3.6006150% | 10.261969 |
| rsi-bollinger | -24.252523 | 11 | 16.6666666% | 2.7890262% | 4.752530 |

Orders above exclude forced terminal liquidation, as the competition does.
Win rate counts completed round trips, including terminal liquidation.

Fresh runs on the first and last 720 bars respectively: first half +9.779339
USDC, 2 filled orders, 100% win rate, 0.5166304% drawdown, 0.724058 fees;
second half 0 USDC, no trades, no win rate, no drawdown or fees.

Single-parameter changes kept net PnL positive: dip 0.8% / 1.0% earned
9.128210 / 9.779339; surge 1.2% / 1.6% earned 9.779339 each; SMA 50 / 70
earned 5.325955 / 9.779339; profit target 1.0% / 1.4% earned 7.860266 /
9.779339; holding limit 100 / 140 earned 6.212368 / 9.779339.

Two final full-window executions produced identical raw reply logs, SHA-256:
`0c8d5a4f4564d229357a673c2e43455235adce5a2223962149fc2875d09a0b57`.

The intended edge is rebound after unusually deep short-term pullbacks, with
an alternative entry for unusually strong continuation. The dev profit comes
from one pullback rebound; the surge path is unproven here. A continuing
selloff can stop out repeatedly, and a quiet race can generate no trades.
The second half's lack of trades and the small sample limit confidence.

## Robustness revision

The revised bot uses a 95-bar SMA, an 80 bp dip, an 80 bp profit target and
240-bar holding limit. The 140 bp three-bar surge, 80 bp protective stop,
90% size, 15-bar cooldown and 250 bp slippage cap are unchanged. This extends
the rebound horizon rather than forcing entries simply to satisfy a guardrail.
The previous strategy and measurements above describe the submitted starting
point; the following table describes the replacement.

| Metric | Previous | Revised |
| --- | ---: | ---: |
| Full dev net PnL (USDC) | 9.779339 | 19.620115 |
| First-half net PnL | 9.779339 | 16.036961 |
| Second-half net PnL | 0 | 3.556210 |
| Completed round trips, first / second half | 1 / 0 | 2 / 1 |
| Full dev filled orders | 2 | 6 |
| Win rate | 100% | 100% |
| Max drawdown | 0.5166304% | 0.6515945% |
| Fees (USDC) | 0.724058 | 2.186611 |
| Full dev net PnL at 2x fees | 9.051897 | 17.428896 |

Each half was also run fresh from cash with fresh indicator state. Revised
half-window drawdowns were 0.5948157% / 0.6515956%, fees 1.453483 / 0.721568,
and doubled-fee PnL 14.579483 / 2.833423. All three round trips completed with
ordinary sell orders; no forced terminal liquidation was needed. The full
run decides buys at bars 370, 573 and 1099, and sells at 509, 620 and 1340;
fills occur one bar later. The last trade exits on the time stop.

One-at-a-time neighbors were executed through the actual bot protocol and
rescored with the unmodified kit BarsEngine and scoreBarsActionLog:

| Changed parameter | Full PnL | First-half PnL | Second-half PnL |
| --- | ---: | ---: | ---: |
| SMA 90 | 22.237280 | 16.036961 | 6.131396 |
| SMA 100 | 12.982798 | 9.410601 | 3.556210 |
| Dip 75 bp | 18.172784 | 15.353359 | 2.804745 |
| Dip 85 bp | 15.582207 | 9.410601 | 6.131396 |
| Profit 70 bp | 17.011789 | 12.400380 | 4.577463 |
| Profit 90 bp | 19.667601 | 16.084415 | 3.556210 |
| Stop 60 / 100 bp | 19.620115 | 16.036961 | 3.556210 |
| Holding limit 210 | 19.887241 | 16.036961 | 3.819043 |
| Holding limit 270 | 20.216040 | 16.036961 | 4.142617 |
| Surge 120 / 160 bp | 19.620115 | 16.036961 | 3.556210 |
| Size 80% | 17.230553 | 11.423906 | 5.756903 |
| Size 100% | 21.073190 | 17.322802 | 3.725221 |

Every listed neighbor completes at least one ordinary round trip in each
half, and remains profitable on the full window and both halves at doubled
fees (minimum stressed half PnL 2.082905). These are local one-parameter
checks, not evidence that every combination or wider perturbation wins.
For example, SMA 85 at an 80 bp dip misses the second-half trade; SMA 100
with a 75 bp dip is considerably weaker. We chose the middle of the verified
one-parameter neighborhood rather than the largest dev PnL.

Screening first covered 1,680 settings in the original horizon family, none
meeting positive PnL in both halves and full PnL above 5. A second 8,064-setting
dip-only screen extended SMA and holding horizons; 115 made money in the
second half. These broad exploratory screens imply selection bias. Final
results and the neighbor table above come from actual TypeScript bot replies,
not the approximate screening simulator. Engine and scorer source hashes
match the kit's SOURCES.sha256. The grade-local process command reverified
the kit and dataset but still failed at `git init: spawnSync git EPERM`.
This remains external local validation, not a new official server grade.
Evaluation programs and logs remain outside the repository.

Two executions of the revised repository produced byte-identical replies
and byte-identical kit action logs (verified with cmp). SHA-256:
- Replies: `a901a9716eba8f9b3a2d67d178a98814ba35282b077d32eee97d698ca2474d1a`
- Action log: `ab793367aba8bc6d861b5a87514499ad505c08b74526f70236c4ba4272eab97e`

This is more robust than the starting bot on the requested tests: more
independent entries, completed profitable trades in both halves, profitable
neighbors and fee stress, with less than 1% measured drawdown. It does not
guarantee a trade in a flat race. It still needs a meaningful pullback and
rebound, can lose repeatedly in a downtrend, and now holds capital for up to
four hours. Three winning trades on one known day are a small, selected
sample; the untested surge path and future liquidity remain uncertainties.
No submission, bundle or check command was run for this revision.
