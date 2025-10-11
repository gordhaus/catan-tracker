import { Button, Divider, Paper, Typography, Box } from "@mui/material";
import { motion, AnimatePresence } from "motion/react";
import type { State } from "./App";
import { DICE_OUTCOMES } from "../lib/diceConstants";

interface DiceTabProps {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
}

export function DiceTab(props: DiceTabProps) {
  const numPlayers = props.state.players.length;
  const players = [...props.state.players].reverse();

  // Create array with all rolls + empty padding + next indicator
  const displayCells: Array<{
    type: "roll" | "next" | "empty";
    value?: number;
    turnNumber: number;
  }> = [];
  props.state.rolls.forEach((roll, idx) => {
    displayCells.push({ type: "roll", value: roll, turnNumber: idx + 1 });
  });

  // Add next indicator
  displayCells.push({ type: "next", turnNumber: displayCells.length + 1 });

  // Add empty cells to fill out the last row
  const fill = (numPlayers - (displayCells.length % numPlayers)) % numPlayers;
  for (let i = 0; i < fill; ++i) {
    displayCells.push({ type: "empty", turnNumber: displayCells.length + 1 });
  }

  // Reverse to show most recent at top (but keep stable turn numbers)
  const reversedCells = [...displayCells].reverse();

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: 2,
          px: 2,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(4, 64px)",
              sm: "repeat(6, 64px)",
              md: "repeat(12, 64px)",
            },
            gap: 1,
          }}
        >
          {DICE_OUTCOMES.map((outcome) => (
            <Button
              key={outcome}
              variant="contained"
              onClick={() =>
                props.setState((state) => ({
                  ...state,
                  rolls: state.rolls.concat([outcome]),
                }))
              }
              sx={{
                width: "64px",
                height: "64px",
                fontSize: "1.2rem",
                fontWeight: "bold",
              }}
            >
              {outcome}
            </Button>
          ))}
          <Button
            variant="outlined"
            onClick={() =>
              props.setState((state) => ({
                ...state,
                rolls: state.rolls.slice(0, -1),
              }))
            }
            sx={{
              width: "64px",
              height: "64px",
            }}
          >
            ↶
          </Button>
        </Box>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ px: 2 }}>
        {/* Create a CSS Grid container */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${numPlayers}, 1fr)`,
            gap: 0.5,
          }}
        >
          {/* Header row - fixed, no animation */}
          {players.map((player, index) => (
            <Box key={`header-player-${index}`}>
              <Paper
                elevation={0}
                sx={{
                  padding: 0.5,
                  textAlign: "center",
                  backgroundColor: "primary.light",
                  color: "primary.contrastText",
                }}
              >
                <Typography variant="caption" fontWeight="bold">
                  {player}
                </Typography>
              </Paper>
            </Box>
          ))}

          {/* Data cells with animation */}
          <AnimatePresence mode="popLayout">
            {reversedCells.map((cell) => (
              <motion.div
                key={`turn-${cell.turnNumber}`}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    padding: 0.75,
                    textAlign: "center",
                    minHeight: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      cell.type === "next"
                        ? "action.hover"
                        : cell.type === "empty"
                          ? "transparent"
                          : "background.paper",
                    border:
                      cell.type === "next"
                        ? "2px dashed"
                        : cell.type === "empty"
                          ? "none"
                          : "1px solid",
                    borderColor:
                      cell.type === "next" ? "primary.main" : "divider",
                    position: "relative",
                  }}
                >
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    color={
                      cell.type === "next" ? "text.secondary" : "text.primary"
                    }
                  >
                    {cell.type === "next"
                      ? ""
                      : cell.type === "roll"
                        ? cell.value
                        : ""}
                  </Typography>
                  {cell.type === "roll" && (
                    <Typography
                      variant="caption"
                      sx={{
                        position: "absolute",
                        bottom: 2,
                        right: 4,
                        opacity: 0.4,
                        fontSize: "0.65rem",
                      }}
                    >
                      {cell.turnNumber}
                    </Typography>
                  )}
                </Paper>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      </Box>
    </>
  );
}
