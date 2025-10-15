import {
  Box,
  Button,
  Divider,
  Typography,
  Paper,
  Stack,
  Container,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import React from "react";
import type { State } from "./App";
import type { Resource } from "./ResourceNumberSelector";
import { rolls } from "../lib/adaptiveDice";

const resourceAbbrev: Record<Resource, string> = {
  WHEAT: "GE",
  ORE: "E",
  WOOD: "H",
  CLAY: "L",
  WOOL: "W",
  GOLD: "GO",
};

const resourceColors: Record<Resource, string> = {
  WHEAT: "#F4D03F",
  ORE: "#95A5A6",
  WOOD: "#2D5016", // Dark green for wood
  CLAY: "#E67E22",
  WOOL: "#A8D5A1", // Light warm green for wool
  GOLD: "#FFD700",
};

interface SettlementsTabProps {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
  CreateSettlement: React.ReactNode;
}

export function SettlementsTab(props: SettlementsTabProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [settlementToDelete, setSettlementToDelete] = React.useState<
    number | null
  >(null);

  const handleDeleteClick = (settlementId: number) => {
    setSettlementToDelete(settlementId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (settlementToDelete !== null) {
      props.setState((state) => {
        const index = state.settlements.findIndex(
          (element) => element.id === settlementToDelete
        );
        return {
          ...state,
          settlements: [
            ...state.settlements.slice(0, index),
            ...state.settlements.slice(index + 1),
          ],
        };
      });
    }
    setDeleteDialogOpen(false);
    setSettlementToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSettlementToDelete(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>{props.CreateSettlement}</Box>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: "bold" }}>
        Siedlungen & Städte
      </Typography>

      <Stack spacing={4}>
        {props.state.players.map((player) => {
          const playerSettlements = props.state.settlements
            .filter((settlement) => settlement.player === player)
            .sort((a, b) => a.turn - b.turn);

          return (
            <Box key={player}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  color: "primary.main",
                  fontWeight: "bold",
                  mb: 2,
                }}
              >
                {player}
              </Typography>

              {playerSettlements.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    textAlign: "center",
                    backgroundColor: "grey.50",
                    border: "1px dashed",
                    borderColor: "grey.300",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Noch keine Siedlungen
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={2}>
                  {playerSettlements.map((settlement) => (
                    <Card
                      key={settlement.id}
                      elevation={2}
                      sx={{
                        "&:hover": {
                          boxShadow: 4,
                        },
                        position: "relative",
                      }}
                    >
                      <CardContent sx={{ py: 2, pb: { xs: 5, sm: 2 } }}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={{ xs: 1, sm: 2 }}
                          alignItems={{ xs: "stretch", sm: "center" }}
                          justifyContent="space-between"
                        >
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 1,
                              flex: 1,
                              alignItems: "center",
                            }}
                          >
                            {settlement.income.map((income, index) => {
                              // Apply dice-specific styling based on number probability
                              const getDiceStyle = (value: number) => {
                                switch (value) {
                                  case 2:
                                  case 12:
                                    return { fontWeight: 200, opacity: 0.7 };
                                  case 3:
                                  case 11:
                                    return { fontWeight: 300, opacity: 0.8 };
                                  case 4:
                                  case 10:
                                    return { fontWeight: 400, opacity: 0.9 };
                                  case 5:
                                  case 9:
                                    return { fontWeight: 500, opacity: 0.95 };
                                  case 6:
                                  case 8:
                                    return { fontWeight: 900, opacity: 1 };
                                  case 7:
                                    return { fontWeight: 400, opacity: 1 };
                                  default:
                                    return { fontWeight: 700, opacity: 1 };
                                }
                              };

                              const diceStyle = getDiceStyle(income.number);

                              return (
                                <Box
                                  key={`${settlement.id}-${index}`}
                                  sx={{
                                    display: "flex",
                                    alignItems: "stretch",
                                    overflow: "hidden",
                                    borderRadius: "16px",
                                    height: 32,
                                  }}
                                >
                                  {/* Resource letter segment */}
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      backgroundColor:
                                        resourceColors[income.resource],
                                      minWidth: 42,
                                      px: 1.5,
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        color: "white",
                                        fontWeight: "bold",
                                        fontSize: "0.9rem",
                                      }}
                                    >
                                      {resourceAbbrev[income.resource]}
                                    </Typography>
                                  </Box>
                                  {/* Number segment */}
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      backgroundColor: "rgba(0, 0, 0, 0.15)",
                                      minWidth: 32,
                                      px: 1.25,
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        color: "white",
                                        fontSize: "0.9rem",
                                        fontWeight: diceStyle.fontWeight,
                                        opacity: diceStyle.opacity,
                                      }}
                                    >
                                      {income.number}
                                    </Typography>
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>

                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{
                              flexShrink: 0,
                            }}
                          >
                            {/* Only show upgrade button if:
                                1. This settlement hasn't been upgraded yet
                                2. This settlement is not itself a city (doesn't have upgradedFromId) */}
                            {!settlement.upgradedFromId &&
                              !props.state.settlements.some(
                                (s) => s.upgradedFromId === settlement.id
                              ) && (
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  size="small"
                                  startIcon={<HomeWorkIcon />}
                                  sx={{
                                    minWidth: { xs: "auto", sm: "auto" },
                                    flex: { xs: 1, sm: "0 0 auto" },
                                  }}
                                  onClick={() =>
                                    props.setState((state) => {
                                      const nextId =
                                        state.settlements.length === 0
                                          ? 0
                                          : Math.max(
                                              ...state.settlements.map(
                                                (s) => s.id
                                              )
                                            ) + 1;
                                      return {
                                        ...state,
                                        settlements: [
                                          ...state.settlements,
                                          {
                                            ...settlement,
                                            turn:
                                              rolls(state.diceState).length - 1,
                                            id: nextId,
                                            upgradedFromId: settlement.id,
                                          },
                                        ],
                                      };
                                    })
                                  }
                                >
                                  Zur Stadt ausbauen
                                </Button>
                              )}
                            {/* Only show delete button if:
                                1. This is a city (has upgradedFromId), OR
                                2. This is a settlement that hasn't been upgraded yet */}
                            {(settlement.upgradedFromId ||
                              !props.state.settlements.some(
                                (s) => s.upgradedFromId === settlement.id
                              )) && (
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleDeleteClick(settlement.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </Stack>
                        </Stack>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            position: "absolute",
                            bottom: 4,
                            left: 16,
                            fontSize: "0.7rem",
                            opacity: 0.6,
                          }}
                        >
                          Gebaut in Zug {settlement.turn + 1}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          );
        })}
      </Stack>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Siedlung löschen?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchtest du diese Siedlung wirklich löschen? Diese Aktion kann nicht
            rückgängig gemacht werden.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} autoFocus>
            Abbrechen
          </Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
