"use client";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
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
import {
  ResourceNumberSelector,
  type DiceOutcome,
  type Resource,
  type OptionalFieldValue,
} from "./ResourceNumberSelector";
import { DiceTab } from "./DiceTab";
import { SettlementsTab } from "./SettlementsTab";
import { StatsTab } from "./StatsTab";
import { TabHeader } from "./TabHeader";

interface Income {
  resource: Resource;
  number: DiceOutcome;
}

interface Settlement {
  income: Income[];
  player: string;
  turn: number;
  id: number;
}

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

const NUM_INCOME_SLOTS = 3;

function CreateSettlement(props: CreateSettlementProps) {
  const [player, setPlayer] = React.useState(props.playerOnTurn ?? "");
  const [incomes, setIncomes] = React.useState<
    Array<{
      resource: OptionalFieldValue<Resource>;
      number: OptionalFieldValue<DiceOutcome>;
    }>
  >(
    Array.from({ length: NUM_INCOME_SLOTS }, () => ({
      resource: "",
      number: "",
    }))
  );
  const [turn, setTurn] = React.useState<number>(props.turn);

  const updateIncome = (
    index: number,
    field: "resource" | "number",
    value: OptionalFieldValue<Resource> | OptionalFieldValue<DiceOutcome>
  ) => {
    setIncomes((prev) =>
      prev.map((income, i) =>
        i === index ? { ...income, [field]: value } : income
      )
    );
  };

  const resetForm = () => {
    setPlayer(props.playerOnTurn ?? "");
    setIncomes(
      Array.from({ length: NUM_INCOME_SLOTS }, () => ({
        resource: "",
        number: "",
      }))
    );
  };

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
      {incomes.map((income, index) => (
        <ResourceNumberSelector
          key={index}
          index={index + 1}
          resource={income.resource}
          number={income.number}
          onResourceChange={(value) => updateIncome(index, "resource", value)}
          onNumberChange={(value) => updateIncome(index, "number", value)}
        />
      ))}
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
                  income: removeEmptyIncomes(incomes),
                },
              ]),
            }),
            props.setState
          );
          resetForm();
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
      <TabHeader currentTurn={currentTurn} nextTurn={nextTurn} />
      <Tabs value={tab} onChange={handleChange} variant="fullWidth">
        <Tab label="Würfel" value="DICE" />
        <Tab label="Siedlungen" value="SETTLEMENTS" />
        <Tab label="Stats" value="STATS" />
      </Tabs>
      {tab === "DICE" && (
        <DiceTab state={props.state} setState={props.setState} />
      )}
      {tab === "SETTLEMENTS" && (
        <SettlementsTab
          state={props.state}
          setState={props.setState}
          CreateSettlement={
            <CreateSettlement
              key={props.state.rolls.length}
              state={props.state}
              setState={props.setState}
              turn={props.state.rolls.length - 1}
              playerOnTurn={currentTurn}
            />
          }
        />
      )}
      {tab === "STATS" && (
        <StatsTab state={props.state} setState={props.setState} />
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
