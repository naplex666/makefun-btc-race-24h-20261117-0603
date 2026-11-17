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
