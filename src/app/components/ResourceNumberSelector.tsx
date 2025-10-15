import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { DICE_OUTCOMES, type DiceOutcome } from "../lib/diceConstants";

const resources = ["WHEAT", "ORE", "WOOD", "CLAY", "WOOL", "GOLD"] as const;
export type Resource = (typeof resources)[number];

const resourceNames: Record<Resource, string> = {
  WHEAT: "Getreide",
  ORE: "Erz",
  WOOD: "Holz",
  CLAY: "Lehm",
  WOOL: "Wolle",
  GOLD: "Gold",
};

export type OptionalFieldValue<T> = T | "";

interface ResourceNumberSelectorProps {
  index: number;
  resource: OptionalFieldValue<Resource>;
  number: OptionalFieldValue<DiceOutcome>;
  onResourceChange: (value: OptionalFieldValue<Resource>) => void;
  onNumberChange: (value: OptionalFieldValue<DiceOutcome>) => void;
}

export function ResourceNumberSelector(props: ResourceNumberSelectorProps) {
  return (
    <Box display={"flex"} gap={2} flexDirection={"row"}>
      <FormControl>
        <InputLabel id={`create-starting-settlement-resource-${props.index}`}>
          Rohstoff {props.index}
        </InputLabel>
        <Select
          value={props.resource}
          label={`Rohstoff ${props.index}`}
          onChange={(event) => props.onResourceChange(event.target.value)}
          sx={{ width: "150px" }}
        >
          {resources.map((resource) => (
            <MenuItem
              key={`resource-${props.index}-${resource}`}
              value={resource}
            >
              {resourceNames[resource]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl>
        <InputLabel id={`create-starting-settlement-number-${props.index}`}>
          Zahlenchip {props.index}
        </InputLabel>
        <Select
          value={props.number}
          label={`Zahlenchip ${props.index}`}
          onChange={(event) => props.onNumberChange(event.target.value)}
          sx={{ width: "150px" }}
        >
          {DICE_OUTCOMES.map((number) => (
            <MenuItem key={`chip-${props.index}-${number}`} value={number}>
              {number}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
