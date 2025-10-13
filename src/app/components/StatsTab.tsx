import { Divider } from "@mui/material";
import { BarChart } from "@mui/x-charts";
import type { State } from "./App";
import { DICE_OUTCOMES, DICE_OUTCOME_COUNTS } from "../lib/diceConstants";
import { rolls } from "../lib/adaptiveDice";

interface StatsTabProps {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
}

export function StatsTab(props: StatsTabProps) {
  const rollsArray = rolls(props.state.diceState);

  return (
    <>
      <h3>Würfel</h3>
      <BarChart
        barLabel={"value"}
        layout="horizontal"
        height={500}
        yAxis={[{ data: DICE_OUTCOMES }]}
        series={[
          {
            id: "expectedId",
            label: "expected",
            data: DICE_OUTCOMES.map(
              (outcome) =>
                Math.round(
                  (DICE_OUTCOME_COUNTS[outcome] * rollsArray.length * 10) / 36
                ) / 10
            ),
          },
          {
            id: "actualId",
            label: "actual",
            data: DICE_OUTCOMES.map(
              (outcome) => rollsArray.filter((roll) => roll === outcome).length
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
                              ((rollsArray.length - settlement.turn - 1) *
                                DICE_OUTCOME_COUNTS[income.number]) /
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
                  rollsArray
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
        yAxis={[{ data: DICE_OUTCOMES }]}
        series={[
          {
            id: "expectedId",
            label: "expected",
            data: DICE_OUTCOMES.map(
              (outcome) =>
                Math.round((DICE_OUTCOME_COUNTS[outcome] * 18 * 10) / 36) / 10
            ),
          },
          {
            id: "actualId",
            label: "actual",
            data: DICE_OUTCOMES.map(
              (outcome) =>
                rollsArray
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
                                DICE_OUTCOME_COUNTS[income.number]) /
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
                  rollsArray
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
