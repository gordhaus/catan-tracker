"use client";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Tab,
  Tabs,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import {
  deleteSession,
  downloadState,
  getState,
  saveState,
} from "../localStorage";
import styles from "../page.module.css";
import { type DiceOutcome } from "../lib/diceConstants";
import { type DiceState, rolls } from "../lib/adaptiveDice";
import { DiceTab } from "./DiceTab";
import { SettlementsTab } from "./SettlementsTab";
import { StatsTab } from "./StatsTab";
import { TabHeader } from "./TabHeader";
import { PlayerSetup } from "./PlayerSetup";
import { CreateSettlement } from "./CreateSettlement";
import type { Resource } from "./ResourceNumberSelector";

interface Income {
  resource: Resource;
  number: DiceOutcome;
}

interface Settlement {
  income: Income[];
  player: string;
  turn: number;
  id: number;
  upgradedFromId?: number; // If this is a city, reference to the settlement it was upgraded from
}

export interface State {
  players: string[];
  settlements: Settlement[];
  diceState: DiceState;
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

function IngameInterface(props: {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
}) {
  const rollsArray = rolls(props.state.diceState);
  const currentTurn =
    rollsArray.length === 0
      ? undefined
      : props.state.players[
          (rollsArray.length - 1) % props.state.players.length
        ];
  const nextTurn =
    props.state.players[rollsArray.length % props.state.players.length];

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
      <TabHeader currentTurn={currentTurn} nextTurn={nextTurn} />
      <Box sx={{ mt: 1 }}>
        <Tabs value={tab} onChange={handleChange} variant="fullWidth">
          <Tab label="Würfel" value="DICE" />
          <Tab label="Siedlungen" value="SETTLEMENTS" />
          <Tab label="Stats" value="STATS" />
        </Tabs>
      </Box>
      <Box sx={{ mt: 4 }}>
        {tab === "DICE" && (
          <DiceTab state={props.state} setState={props.setState} />
        )}
        {tab === "SETTLEMENTS" && (
          <SettlementsTab
            state={props.state}
            setState={props.setState}
            CreateSettlement={
              <CreateSettlement
                key={rollsArray.length}
                state={props.state}
                setState={props.setState}
                turn={rollsArray.length - 1}
                playerOnTurn={currentTurn}
              />
            }
          />
        )}
        {tab === "STATS" && (
          <StatsTab state={props.state} setState={props.setState} />
        )}
      </Box>
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", gap: 4 }}>
        <Divider />
        <Button onClick={() => downloadState()}>Exportieren</Button>
        <Button onClick={() => setOpenDialog(true)}>Neue Session</Button>
      </Box>
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
