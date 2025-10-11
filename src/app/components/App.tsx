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
import React, { useState, useEffect } from "react";
import {
  deleteSession,
  downloadState,
  getState,
  saveState,
} from "../localStorage";
import styles from "../page.module.css";
import {
  ResourceNumberSelector,
  type Resource,
  type OptionalFieldValue,
} from "./ResourceNumberSelector";
import { type DiceOutcome } from "../lib/diceConstants";
import { DiceTab } from "./DiceTab";
import { SettlementsTab } from "./SettlementsTab";
import { StatsTab } from "./StatsTab";
import { TabHeader } from "./TabHeader";
import { PlayerSetup } from "./PlayerSetup";

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

  // Automatically sync state to localStorage whenever it changes
  React.useEffect(() => {
    saveState(state);
  }, [state]);

  return (
    <div className={styles.page}>
      {!state.players.length ? (
        <PlayerSetup setState={setState} />
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
          props.setState((state) => ({
            ...state,
            settlements: state.settlements.concat([
              {
                id:
                  state.settlements.length === 0
                    ? 0
                    : Math.max(
                        ...state.settlements.map((settlement) => settlement.id)
                      ) + 1,
                turn,
                player,
                income: removeEmptyIncomes(incomes),
              },
            ]),
          }));
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

  // Screen Wake Lock
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator && navigator.wakeLock) {
          wakeLock = await navigator.wakeLock.request("screen");
          console.log("Screen Wake Lock active");

          wakeLock.addEventListener("release", () => {
            console.log("Screen Wake Lock released");
            wakeLock = null;
          });
        }
      } catch (err) {
        console.error("Failed to acquire Screen Wake Lock:", err);
      }
    };

    // Request wake lock on mount
    requestWakeLock();

    // Re-acquire wake lock when page becomes visible
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && wakeLock === null) {
        await requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Release wake lock on unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLock !== null) {
        wakeLock.release().then(() => {
          wakeLock = null;
        });
      }
    };
  }, []);

  function closeDialog() {
    setOpenDialog(false);
  }

  const handleChange = (_event: React.SyntheticEvent, newValue: Tab) => {
    setTab(newValue);
  };
  return (
    <>
      <TabHeader
        currentTurn={currentTurn}
        nextTurn={nextTurn}
        players={props.state.players}
        rollsLength={props.state.rolls.length}
      />
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
