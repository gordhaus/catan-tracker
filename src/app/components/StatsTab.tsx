import { Divider } from "@mui/material";
import { BarChart } from "@mui/x-charts";
import type { State } from "./App";
import type { DiceOutcome } from "./ResourceNumberSelector";

const diceOutcomes = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

const probabilities: Record<DiceOutcome, number> = {
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 6,
  8: 5,
  9: 4,
  10: 3,
  11: 2,
  12: 1,
};

interface StatsTabProps {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
}

export function StatsTab(props: StatsTabProps) {
  return (
    <>
      <h3>Würfel</h3>
      <BarChart
        barLabel={"value"}
        layout="horizontal"
        height={500}
        yAxis={[{ data: diceOutcomes }]}
        series={[
          {
            id: "expectedId",
            label: "expected",
            data: diceOutcomes.map(
              (outcome) =>
                Math.round(
                  (probabilities[outcome] * props.state.rolls.length * 10) / 36
                ) / 10
            ),
          },
          {
            id: "actualId",
            label: "actual",
            data: diceOutcomes.map(
              (outcome) =>
                props.state.rolls.filter((roll) => roll === outcome).length
            ),
          },
        ]}
      ></BarChart>
      <Divider></Divider>
      <h3>Rohstoffe</h3>
      <BarChart
        barLabel={"value"}
        height={300}
        xAxis={[{ data: props.state.players }]}
        series={[
          {
            id: "expectedId",
            label: "expected",
            data: props.state.players.map(
              (player) =>
                Math.round(
                  10 *
                    props.state.settlements
                      .filter((settlement) => settlement.player === player)
                      .map((settlement) =>
                        settlement.income
                          .map(
                            (income) =>
                              ((props.state.rolls.length -
                                settlement.turn -
                                1) *
                                probabilities[income.number]) /
                              36
                          )
                          .reduce((partialSum, a) => partialSum + a, 0)
                      )
                      .reduce((partialSum, a) => partialSum + a, 0)
                ) / 10
            ),
          },
          {
            id: "actualtId",
            label: "actual",
            data: props.state.players.map((player) =>
              props.state.settlements
                .filter((settlement) => settlement.player === player)
                .map((settlement) =>
                  props.state.rolls
                    .slice(settlement.turn < 0 ? undefined : settlement.turn)
                    .map(
                      (roll) =>
                        settlement.income.filter(
                          (income) => income.number === roll
                        ).length
                    )
                    .reduce((partialSum, a) => partialSum + a, 0)
                )
                .reduce((partialSum, a) => partialSum + a, 0)
            ),
          },
        ]}
      ></BarChart>
      <Divider></Divider>
      <h3>Würfel erste 18 Züge</h3>
      <BarChart
        barLabel={"value"}
        layout="horizontal"
        height={500}
        yAxis={[{ data: diceOutcomes }]}
        series={[
          {
            id: "expectedId",
            label: "expected",
            data: diceOutcomes.map(
              (outcome) =>
                Math.round((probabilities[outcome] * 18 * 10) / 36) / 10
            ),
          },
          {
            id: "actualId",
            label: "actual",
            data: diceOutcomes.map(
              (outcome) =>
                props.state.rolls
                  .slice(undefined, 18)
                  .filter((roll) => roll === outcome).length
            ),
          },
        ]}
      ></BarChart>
      <h3>Rohstoffe erste 18 Züge</h3>
      <BarChart
        barLabel={"value"}
        height={300}
        xAxis={[{ data: props.state.players }]}
        series={[
          {
            id: "startExpectedId",
            label: "expected",
            data: props.state.players.map(
              (player) =>
                Math.round(
                  10 *
                    props.state.settlements
                      .filter((settlement) => settlement.player === player)
                      .filter((settlement) => settlement.turn < 17)
                      .map((settlement) =>
                        settlement.income
                          .map(
                            (income) =>
                              ((18 - settlement.turn - 1) *
                                probabilities[income.number]) /
                              36
                          )
                          .reduce((partialSum, a) => partialSum + a, 0)
                      )
                      .reduce((partialSum, a) => partialSum + a, 0)
                ) / 10
            ),
          },
          {
            id: "startActualId",
            label: "actual",
            data: props.state.players.map((player) =>
              props.state.settlements
                .filter((settlement) => settlement.player === player)
                .map((settlement) =>
                  props.state.rolls
                    .slice(
                      settlement.turn < 0 ? undefined : settlement.turn,
                      18
                    )
                    .map(
                      (roll) =>
                        settlement.income.filter(
                          (income) => income.number === roll
                        ).length
                    )
                    .reduce((partialSum, a) => partialSum + a, 0)
                )
                .reduce((partialSum, a) => partialSum + a, 0)
            ),
          },
        ]}
      ></BarChart>
    </>
  );
}
