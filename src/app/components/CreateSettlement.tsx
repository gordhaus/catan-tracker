import React from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Alert,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  ResourceNumberSelector,
  type Resource,
  type OptionalFieldValue,
} from "./ResourceNumberSelector";
import { type DiceOutcome } from "../lib/diceConstants";
import { rolls } from "../lib/adaptiveDice";
import type { State } from "./App";

interface Income {
  resource: Resource;
  number: DiceOutcome;
}

interface CreateSettlementProps {
  setState: React.Dispatch<React.SetStateAction<State>>;
  state: State;
  showCreateSettlement?: React.Dispatch<React.SetStateAction<boolean>>;
  playerOnTurn?: string;
  turn: number;
}

const NUM_INCOME_SLOTS = 3;

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

export function CreateSettlement(props: CreateSettlementProps) {
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
  const [errors, setErrors] = React.useState<string[]>([]);

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
    setErrors([]);
  };

  const validateAndSave = () => {
    const validationErrors: string[] = [];

    // Check if player is selected
    if (player === "") {
      validationErrors.push("Bitte wähle einen Spieler aus.");
    }

    // Check for incomplete income pairs (resource without number or vice versa)
    incomes.forEach((income, index) => {
      const hasResource = income.resource !== "";
      const hasNumber = income.number !== "";

      if (hasResource && !hasNumber) {
        validationErrors.push(
          `Einkommen ${index + 1}: Ressource ausgewählt, aber keine Zahl.`
        );
      } else if (!hasResource && hasNumber) {
        validationErrors.push(
          `Einkommen ${index + 1}: Zahl ausgewählt, aber keine Ressource.`
        );
      }
    });

    // Check if at least one complete income is provided
    const completeIncomes = incomes.filter(
      (income) => income.resource !== "" && income.number !== ""
    );
    if (completeIncomes.length === 0) {
      validationErrors.push("Mindestens ein Einkommen muss angegeben werden.");
    }

    // Check if turn is valid (not negative and not in the future)
    const currentTurn = rolls(props.state.diceState).length - 1;
    if (turn < 0) {
      validationErrors.push("Zug-Nummer kann nicht negativ sein.");
    } else if (turn > currentTurn) {
      validationErrors.push(
        `Zug-Nummer kann nicht in der Zukunft liegen. Aktueller Zug: ${currentTurn + 1}.`
      );
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // All validations passed, save the settlement
    const nextId =
      props.state.settlements.length === 0
        ? 0
        : Math.max(...props.state.settlements.map((s) => s.id)) + 1;

    props.setState((state) => ({
      ...state,
      settlements: state.settlements.concat([
        {
          id: nextId,
          turn,
          player,
          income: removeEmptyIncomes(incomes),
        },
      ]),
    }));
    resetForm();
  };

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
        Neue Siedlung erstellen
      </Typography>

      {errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrors([])}>
          <Stack spacing={0.5}>
            {errors.map((error, index) => (
              <Typography key={index} variant="body2">
                • {error}
              </Typography>
            ))}
          </Stack>
        </Alert>
      )}

      <Stack spacing={0}>
        <Stack direction="row" spacing={2}>
          <FormControl fullWidth>
            <InputLabel id="create-starting-settlement-player">
              Spieler
            </InputLabel>
            <Select
              labelId="create-starting-settlement-player"
              value={player}
              label="Spieler"
              onChange={(event) => setPlayer(event.target.value)}
            >
              {props.state.players?.map((player) => (
                <MenuItem key={`create-settlement-${player}`} value={player}>
                  {player}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Zug"
            type="number"
            value={turn}
            onChange={(event) => setTurn(Number(event.target.value))}
            sx={{ width: 100 }}
            slotProps={{
              formHelperText: {
                sx: { whiteSpace: "nowrap" },
              },
            }}
            helperText={`Jetzt: ${rolls(props.state.diceState).length}`}
          />
        </Stack>

        <Box>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ mb: 1.5 }}
          >
            Einkommen
          </Typography>
          <Stack spacing={2}>
            {incomes.map((income, index) => (
              <ResourceNumberSelector
                key={index}
                index={index + 1}
                resource={income.resource}
                number={income.number}
                onResourceChange={(value) =>
                  updateIncome(index, "resource", value)
                }
                onNumberChange={(value) => updateIncome(index, "number", value)}
              />
            ))}
          </Stack>
        </Box>

        <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
          <Button
            variant="contained"
            onClick={validateAndSave}
            fullWidth
            size="large"
          >
            Speichern
          </Button>
          {props.showCreateSettlement !== undefined && (
            <Button
              variant="outlined"
              onClick={() => {
                if (!!props.showCreateSettlement)
                  props.showCreateSettlement(false);
              }}
              fullWidth
              size="large"
            >
              Spiel Starten
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
