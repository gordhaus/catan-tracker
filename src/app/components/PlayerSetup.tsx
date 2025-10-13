import {
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Container,
  Stack,
  Paper,
  Divider,
  Alert,
} from "@mui/material";
import React from "react";
import { importState } from "../localStorage";
import type { State } from "./App";
import type { DiceMode, DiceState } from "../lib/adaptiveDice";

interface PlayerSetupProps {
  setState: React.Dispatch<React.SetStateAction<State>>;
}

export function PlayerSetup(props: PlayerSetupProps) {
  const [players, setPlayers] = React.useState(["", "", "", ""]);
  const [diceMode, setDiceMode] = React.useState<DiceMode>("real-life");
  const [error, setError] = React.useState<string>("");

  const createInitialDiceState = (mode: DiceMode): DiceState => {
    if (mode === "real-life") {
      return { mode: "real-life" };
    }
    if (mode === "adaptive") {
      return { mode: "adaptive" };
    }
    if (mode === "shuffle-bag") {
      return { mode: "shuffle-bag", bagSize: 36 };
    }
    const _exhaustive: never = mode;
    throw new Error(`Unknown dice mode: ${_exhaustive}`);
  };

  const handleStartGame = () => {
    const filledPlayers = players.filter((player) => player.trim() !== "");

    // Check if at least one player is entered
    if (filledPlayers.length === 0) {
      setError("Bitte geben Sie mindestens einen Spieler ein.");
      return;
    }

    // Check for empty names in between (e.g., player1, "", player3)
    const firstEmptyIndex = players.findIndex((p) => p.trim() === "");
    const lastFilledIndex = players.findLastIndex((p) => p.trim() !== "");

    if (firstEmptyIndex !== -1 && firstEmptyIndex < lastFilledIndex) {
      setError(
        "Bitte füllen Sie die Spielernamen ohne Lücken aus (von oben nach unten)."
      );
      return;
    }

    // Clear error and start game
    setError("");
    props.setState((state) => ({
      ...state,
      players: filledPlayers,
      diceState: createInitialDiceState(diceMode),
    }));
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom align="center">
            Neues Spiel starten
          </Typography>

          <Stack spacing={2} sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Spieler
            </Typography>

            {error && (
              <Alert severity="error" onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            {players.map((player, index) => (
              <TextField
                key={index}
                label={`Spieler ${index + 1}`}
                value={player}
                fullWidth
                error={
                  error !== "" &&
                  player.trim() === "" &&
                  index <
                    players.findLastIndex((p) => p.trim() !== "")
                }
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  const newPlayers = [...players];
                  newPlayers[index] = event.target.value;
                  setPlayers(newPlayers);
                  // Clear error when user starts typing
                  if (error) setError("");
                }}
              />
            ))}

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Würfel-Modus
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="dice-mode-label">Würfel-Modus</InputLabel>
              <Select
                labelId="dice-mode-label"
                value={diceMode}
                label="Würfel-Modus"
                onChange={(event) =>
                  setDiceMode(event.target.value as DiceMode)
                }
              >
                <MenuItem value="real-life">Echte Würfel</MenuItem>
                <MenuItem value="adaptive">Adaptive Würfel</MenuItem>
                <MenuItem value="shuffle-bag">Shuffle Bag</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mt: 3 }}>
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleStartGame}
                >
                  Spiel Starten
                </Button>

                <Button
                  component="label"
                  variant="outlined"
                  size="large"
                  fullWidth
                >
                  Spiel Importieren
                  <input
                    type="file"
                    hidden
                    onChange={async (event) => {
                      importState(
                        (await event.target.files?.item(0)?.text()) ?? ""
                      );
                    }}
                    accept="application/json"
                  />
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
