"use client";
import {
  AppBar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import React, { useState } from "react";
import {
  deleteSession,
  downloadState,
  getState,
  importState,
  updateState,
} from "../localStorage";
import styles from "../page.module.css";
import { BarChart } from "@mui/x-charts";

const diceOutcomes = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
type DiceOutcome = (typeof diceOutcomes)[number];

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

const resources = ["WHEAT", "ORE", "WOOD", "CLAY", "WOOL", "GOLD"] as const;
type Resource = (typeof resources)[number];

interface Income {
  resource: Resource;
  number: DiceOutcome;
}

const resourceNames: Record<Resource, string> = {
  WHEAT: "Getreide",
  ORE: "Erz",
  WOOD: "Holz",
  CLAY: "Lehm",
  WOOL: "Wolle",
  GOLD: "Gold",
};

const resourceAbbrev: Record<Resource, string> = {
  WHEAT: "GE",
  ORE: "E",
  WOOD: "H",
  CLAY: "L",
  WOOL: "W",
  GOLD: "GO",
};

interface Settlement {
  income: Income[];
  player: string;
  turn: number;
  id: number;
}

type OptionalFieldValue<T> = T | "";

export interface State {
  players: string[];
  settlements: Settlement[];
  rolls: DiceOutcome[];
}

type Tab = "DICE" | "SETTLEMENTS" | "STATS";

export default function Home() {
  const [state, setState] = React.useState<State>(getState());
  const [player1, updatePlayer1] = React.useState("");
  const [player2, updatePlayer2] = React.useState("");
  const [player3, updatePlayer3] = React.useState("");
  const [player4, updatePlayer4] = React.useState("");

  return (
    <div className={styles.page}>
      {!state.players.length ? (
        <>
          <TextField
            label="Spieler 1"
            value={player1}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              updatePlayer1(event.target.value);
            }}
          ></TextField>
          <TextField
            label="Spieler 2"
            value={player2}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              updatePlayer2(event.target.value);
            }}
          ></TextField>
          <TextField
            label="Spieler 3"
            value={player3}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              updatePlayer3(event.target.value);
            }}
          ></TextField>
          <TextField
            label="Spieler 4"
            value={player4}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              updatePlayer4(event.target.value);
            }}
          ></TextField>
          <Button
            onClick={() =>
              updateState(
                (state) => ({
                  ...state,
                  players: [player1, player2, player3, player4].filter(
                    (player) => player != ""
                  ),
                }),
                setState
              )
            }
          >
            Speichern
          </Button>
          <Button component="label" role={undefined} variant="contained">
            Importieren
            <input
              type="file"
              onChange={async (event) => {
                importState((await event.target.files?.item(0)?.text()) ?? "");
              }}
              accept="application/json"
            />
          </Button>
        </>
      ) : (
        <IngameInterface state={state} setState={setState} />
      )}
    </div>
  );
}

interface CreateSettlementProps {
  setState: React.Dispatch<React.SetStateAction<State>>;
  state: State;
  showCreateSettlement?: React.Dispatch<React.SetStateAction<boolean>>;
  playerOnTurn?: string;
  turn: number;
}

function CreateSettlement(props: CreateSettlementProps) {
  const [player, setPlayer] = React.useState(props.playerOnTurn ?? "");
  const [resource1, setResource1] =
    React.useState<OptionalFieldValue<Resource>>("");
  const [resource2, setResource2] =
    React.useState<OptionalFieldValue<Resource>>("");
  const [resource3, setResource3] =
    React.useState<OptionalFieldValue<Resource>>("");
  const [number1, setNumber1] =
    React.useState<OptionalFieldValue<DiceOutcome>>("");
  const [number2, setNumber2] =
    React.useState<OptionalFieldValue<DiceOutcome>>("");
  const [number3, setNumber3] =
    React.useState<OptionalFieldValue<DiceOutcome>>("");
  const [turn, setTurn] = React.useState<number>(props.turn);

  return (
    <>
      <FormControl>
        <InputLabel id="create-starting-settlement-player">Spieler</InputLabel>
        <Select
          labelId="create-starting-settlement-player"
          value={player}
          label={"Spieler"}
          onChange={(event) => setPlayer(event.target.value)}
          sx={{ width: "150px" }}
        >
          {props.state.players?.map((player) => (
            <MenuItem key={`create-settlement-${player}`} value={player}>
              {player}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Box display={"flex"} gap={2} flexDirection={"row"}>
        <FormControl>
          <InputLabel id="create-starting-settlement-resource-1">
            Rohstoff 1
          </InputLabel>
          <Select
            value={resource1}
            label="Rohstoff 1"
            onChange={(event) => setResource1(event.target.value)}
            sx={{ width: "150px" }}
          >
            {resources.map((resource) => (
              <MenuItem key={`resource-1-${resource}`} value={resource}>
                {resourceNames[resource]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel id="create-starting-settlement-number-1">
            Zahlenchip 1
          </InputLabel>
          <Select
            value={number1}
            label="Zahlenchip 1"
            onChange={(event) => setNumber1(event.target.value)}
            sx={{ width: "150px" }}
          >
            {diceOutcomes.map((number) => (
              <MenuItem key={`chip-1-${number}`} value={number}>
                {number}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box display={"flex"} gap={2} flexDirection={"row"}>
        <FormControl>
          <InputLabel id="create-starting-settlement-resource-2">
            Rohstoff 2
          </InputLabel>
          <Select
            value={resource2}
            label="Rohstoff 2"
            onChange={(event) => setResource2(event.target.value)}
            sx={{ width: "150px" }}
          >
            {resources.map((resource) => (
              <MenuItem key={`resource-2-${resource}`} value={resource}>
                {resourceNames[resource]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel id="create-starting-settlement-number-2">
            Zahlenchip 2
          </InputLabel>
          <Select
            value={number2}
            label="Zahlenchip 2"
            onChange={(event) => setNumber2(event.target.value)}
            sx={{ width: "150px" }}
          >
            {diceOutcomes.map((number) => (
              <MenuItem key={`chip-2-${number}`} value={number}>
                {number}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box display={"flex"} gap={2} flexDirection={"row"}>
        <FormControl>
          <InputLabel id="create-starting-settlement-resource-3">
            Rohstoff 3
          </InputLabel>
          <Select
            value={resource3}
            label="Rohstoff 3"
            onChange={(event) => setResource3(event.target.value)}
            sx={{ width: "150px" }}
          >
            {resources.map((resource) => (
              <MenuItem key={`resource-3-${resource}`} value={resource}>
                {resourceNames[resource]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel id="create-starting-settlement-number-3">
            Zahlenchip 3
          </InputLabel>
          <Select
            value={number3}
            label="Zahlenchip 3"
            onChange={(event) => setNumber3(event.target.value)}
            sx={{ width: "150px" }}
          >
            {diceOutcomes.map((number) => (
              <MenuItem key={`chip-3-${number}`} value={number}>
                {number}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <TextField
        label="Zug"
        value={turn}
        onChange={(event) => setTurn(Number(event.target.value))}
      ></TextField>
      <Button
        onClick={() => {
          if (player === "") return;
          updateState(
            (state) => ({
              ...state,
              settlements: state.settlements.concat([
                {
                  id:
                    state.settlements.length === 0
                      ? 0
                      : Math.max(
                          ...state.settlements.map(
                            (settlement) => settlement.id
                          )
                        ) + 1,
                  turn,
                  player,
                  income: removeEmptyIncomes([
                    { resource: resource1, number: number1 },
                    { resource: resource2, number: number2 },
                    { resource: resource3, number: number3 },
                  ]),
                },
              ]),
            }),
            props.setState
          );
          setPlayer(props.playerOnTurn ?? "");
          setResource1("");
          setResource2("");
          setResource3("");
          setNumber1("");
          setNumber2("");
          setNumber3("");
        }}
      >
        Speichern
      </Button>
      {props.showCreateSettlement !== undefined && (
        <Button
          onClick={() => {
            if (!!props.showCreateSettlement) props.showCreateSettlement(false);
          }}
        >
          Spiel Starten
        </Button>
      )}
    </>
  );
}

function removeEmptyIncomes(
  incomes: {
    resource: OptionalFieldValue<Resource>;
    number: OptionalFieldValue<DiceOutcome>;
  }[]
): Income[] {
  return incomes.filter(
    (income) => income.number !== "" && income.resource !== ""
  ) as Income[];
}

function IngameInterface(props: {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
}) {
  const currentTurn =
    props.state.rolls.length === 0
      ? undefined
      : props.state.players[
          (props.state.rolls.length - 1) % props.state.players.length
        ];
  const nextTurn =
    props.state.players[props.state.rolls.length % props.state.players.length];

  const [openDialog, setOpenDialog] = useState(false);
  const [tab, setTab] = useState<Tab>("DICE");

  function closeDialog() {
    setOpenDialog(false);
  }

  const handleChange = (_event: React.SyntheticEvent, newValue: Tab) => {
    setTab(newValue);
  };
  return (
    <>
      {currentTurn && <h1>{`Am Zug: ${currentTurn}`}</h1>}
      <h2>{`Nächster Zug: ${nextTurn}`}</h2>
      <Tabs value={tab} onChange={handleChange} variant="fullWidth">
        <Tab label="Würfel" value="DICE" />
        <Tab label="Siedlungen" value="SETTLEMENTS" />
        <Tab label="Stats" value="STATS" />
      </Tabs>
      {tab === "DICE" && (
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
              <Grid
                key={`roll-${index}`}
                size={12 / props.state.players.length}
              >
                {roll}
              </Grid>
            ))}
          </Grid>
        </>
      )}
      {tab === "SETTLEMENTS" && (
        <>
          <CreateSettlement
            key={props.state.rolls.length}
            state={props.state}
            setState={props.setState}
            turn={props.state.rolls.length - 1}
            playerOnTurn={currentTurn}
          />
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
                        <div key={`settlemend-${settlement.id}-${index}`}>{`${
                          income.number
                        } ${resourceAbbrev[income.resource]}`}</div>
                      ))}
                    </Box>
                    <Box display={"flex"} flexDirection={"row"} gap={2}>
                      <div>{`Zug: ${settlement.turn}`}</div>
                      <Button
                        onClick={() =>
                          updateState((state) => {
                            const index = state.settlements.findIndex(
                              (element) => element.id === settlement.id
                            );
                            return {
                              ...state,
                              settlements: state.settlements.toSpliced(
                                index,
                                1
                              ),
                            };
                          }, props.setState)
                        }
                      >
                        Löschen
                      </Button>
                    </Box>
                  </div>
                ))}
            </div>
          ))}
        </>
      )}
      {tab === "STATS" && (
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
                      (probabilities[outcome] * props.state.rolls.length * 10) /
                        36
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
          <h3>Rohstoffe</h3>
          <BarChart
            barLabel={"value"}
            height={300}
            xAxis={[{ data: props.state.players }]}
            series={[
              {
                id: "expectedtId",
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
                        .slice(
                          settlement.turn < 0 ? undefined : settlement.turn
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
      )}
      <Divider></Divider>
      <Button onClick={() => downloadState()}>Exportieren</Button>
      <Button onClick={() => setOpenDialog(true)}>Neue Session</Button>
      <Dialog open={openDialog} onClose={closeDialog}>
        <DialogTitle>Wirklich neue Session?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Soll wirklich eine neue Session gestartet werden?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              deleteSession();
              closeDialog();
            }}
          >
            Ja
          </Button>
          <Button onClick={closeDialog} autoFocus>
            Abbrechen
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
