import { Button, TextField } from "@mui/material";
import React from "react";
import { importState } from "../localStorage";
import type { State } from "./App";

interface PlayerSetupProps {
  setState: React.Dispatch<React.SetStateAction<State>>;
}

export function PlayerSetup(props: PlayerSetupProps) {
  const [players, setPlayers] = React.useState(["", "", "", ""]);

  return (
    <>
      {players.map((player, index) => (
        <TextField
          key={index}
          label={`Spieler ${index + 1}`}
          value={player}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            const newPlayers = [...players];
            newPlayers[index] = event.target.value;
            setPlayers(newPlayers);
          }}
        />
      ))}
      <Button
        onClick={() =>
          props.setState((state) => ({
            ...state,
            players: players.filter((player) => player !== ""),
          }))
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
  );
}
