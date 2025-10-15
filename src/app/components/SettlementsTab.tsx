import { Box, Button, Divider } from "@mui/material";
import type { State } from "./App";
import type { Resource } from "./ResourceNumberSelector";

const resourceAbbrev: Record<Resource, string> = {
  WHEAT: "GE",
  ORE: "E",
  WOOD: "H",
  CLAY: "L",
  WOOL: "W",
  GOLD: "GO",
};

interface SettlementsTabProps {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
  CreateSettlement: React.ReactNode;
}

export function SettlementsTab(props: SettlementsTabProps) {
  return (
    <>
      {props.CreateSettlement}
      <Divider />
      <h2>Siedlungen</h2>
      {props.state.players.map((player) => (
        <div key={player}>
          <h2>{player}</h2>
          {props.state.settlements
            .filter((settlement) => settlement.player === player)
            .map((settlement) => (
              <div key={`settlement-${settlement.id}`}>
                <Box display={"flex"} flexDirection={"row"} gap={1}>
                  {settlement.income.map((income, index) => (
                    <div key={`settlement-${settlement.id}-${index}`}>{`${
                      income.number
                    } ${resourceAbbrev[income.resource]}`}</div>
                  ))}
                </Box>
                <Box display={"flex"} flexDirection={"row"} gap={2}>
                  <div>{`Zug: ${settlement.turn}`}</div>
                  <Button
                    onClick={() =>
                      props.setState((state) => {
                        const index = state.settlements.findIndex(
                          (element) => element.id === settlement.id
                        );
                        return {
                          ...state,
                          settlements: [
                            ...state.settlements.slice(0, index),
                            ...state.settlements.slice(index + 1),
                          ],
                        };
                      })
                    }
                  >
                    Löschen
                  </Button>
                  <Button
                    onClick={() =>
                      props.setState((state) => {
                        return {
                          ...state,
                          settlements: [
                            ...state.settlements,
                            {
                              ...settlement,
                              turn: props.state.rolls.length - 1,
                              id:
                                Math.max(
                                  ...state.settlements.map(
                                    (settlement) => settlement.id
                                  )
                                ) + 1,
                            },
                          ],
                        };
                      })
                    }
                  >
                    Stadt
                  </Button>
                </Box>
              </div>
            ))}
        </div>
      ))}
    </>
  );
}
