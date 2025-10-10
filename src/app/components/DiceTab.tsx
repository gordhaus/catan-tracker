import { Button, Divider, Grid } from "@mui/material";
import { updateState } from "../localStorage";
import type { State } from "./App";

const diceOutcomes = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

interface DiceTabProps {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
}

export function DiceTab(props: DiceTabProps) {
  return (
    <>
      <Grid container spacing={2}>
        {diceOutcomes.map((outcome) => (
          <Grid key={outcome} size={4}>
            <Button
              variant="contained"
              onClick={() =>
                updateState(
                  (state) => ({
                    ...state,
                    rolls: state.rolls.concat([outcome]),
                  }),
                  props.setState
                )
              }
            >
              {outcome}
            </Button>
          </Grid>
        ))}
        <Grid size={4}>
          <Button
            variant="contained"
            onClick={() =>
              updateState(
                (state) => ({
                  ...state,
                  rolls: state.rolls.toSpliced(state.rolls.length - 1, 1),
                }),
                props.setState
              )
            }
          >
            Undo
          </Button>
        </Grid>
      </Grid>
      <Divider />
      <Grid container spacing={2}>
        {props.state.players.map((player) => (
          <Grid
            key={`score-sheet-heading-${player}`}
            size={12 / props.state.players.length}
          >
            <h3>{player}</h3>
          </Grid>
        ))}
        {props.state.rolls.map((roll, index) => (
          <Grid key={`roll-${index}`} size={12 / props.state.players.length}>
            {roll}
          </Grid>
        ))}
      </Grid>
    </>
  );
}
