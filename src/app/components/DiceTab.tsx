import { Divider, Paper, Typography, Box } from "@mui/material";
import { motion, AnimatePresence } from "motion/react";
import type { State } from "./App";
import { DICE_OUTCOMES } from "../lib/diceConstants";
import { DiceNumber } from "./DiceNumber";
import { DiceCell } from "./DiceCell";

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
          mb: 4,
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
            <DiceCell
              key={outcome}
              size={64}
              onClick={() =>
                props.setState((state) => ({
                  ...state,
                  rolls: state.rolls.concat([outcome]),
                }))
              }
              sx={{
                backgroundColor: "grey.100",
                "&:hover": {
                  backgroundColor: "grey.200",
                },
              }}
            >
              <DiceNumber value={outcome} variant="button" />
            </DiceCell>
          ))}
          <DiceCell
            size={64}
            onClick={() =>
              props.setState((state) => ({
                ...state,
                rolls: state.rolls.slice(0, -1),
              }))
            }
            sx={{
              backgroundColor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              "&:hover": {
                backgroundColor: "action.hover",
              },
            }}
          >
            <Typography variant="h5" fontWeight="bold">
              ↶
            </Typography>
          </DiceCell>
        </Box>
      </Box>
      <Divider sx={{ mb: 4 }} />
      <Box sx={{ px: 2 }}>
        {/* Create a CSS Grid container */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${numPlayers}, 1fr)`,
            gap: 1,
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
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <DiceCell
                  size={48}
                  sx={{
                    padding: 1,
                    textAlign: "center",
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
                  }}
                >
                  {cell.type === "next" ? (
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="text.secondary"
                    >
                      →
                    </Typography>
                  ) : cell.type === "roll" && cell.value ? (
                    <DiceNumber value={cell.value} />
                  ) : null}
                  {cell.type === "roll" && (
                    <Typography
                      variant="caption"
                      sx={{
                        position: "absolute",
                        bottom: 2,
                        right: 4,
                        opacity: 0.4,
                        fontSize: "0.5rem",
                      }}
                    >
                      {cell.turnNumber}
                    </Typography>
                  )}
                </DiceCell>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      </Box>
    </>
  );
}
