import { Typography } from "@mui/material";

interface DiceNumberProps {
  value: number;
  variant?: "default" | "button";
}

/**
 * Get styling for a dice number based on its probability.
 * Returns different scale factors for button vs default variant.
 */
function getDiceStyle(value: number, variant: "default" | "button") {
  // Base size multiplier: button variant is larger
  const sizeScale = variant === "button" ? 1.25 : 1;
  // Weight offset: button variant has slightly heavier weights
  const weightOffset = variant === "button" ? 100 : 0;

  // Determine style based on dice value and probability
  switch (value) {
    case 2:
    case 12:
      return {
        fontWeight: 200 + weightOffset,
        fontSize: `${0.85 * sizeScale}rem`,
        color: "text.primary",
        opacity: 0.7,
      };
    case 3:
    case 11:
      return {
        fontWeight: 300 + weightOffset,
        fontSize: `${0.9 * sizeScale}rem`,
        color: "text.primary",
        opacity: 0.8,
      };
    case 4:
    case 10:
      return {
        fontWeight: 400 + weightOffset,
        fontSize: `${0.95 * sizeScale}rem`,
        color: "text.primary",
        opacity: 0.9,
      };
    case 5:
    case 9:
      return {
        fontWeight: 500 + weightOffset,
        fontSize: `${1 * sizeScale}rem`,
        color: "text.primary",
        opacity: 0.95,
      };
    case 6:
    case 8:
      return {
        fontWeight: 900,
        fontSize: `${1.15 * sizeScale}rem`,
        color: "error.main",
        opacity: 1,
      };
    case 7:
      return {
        fontWeight: 400 + weightOffset,
        fontSize: `${1 * sizeScale}rem`,
        color: "text.secondary",
        opacity: 1,
      };
    default:
      return {
        fontWeight: 700,
        fontSize: `${1 * sizeScale}rem`,
        color: "text.primary",
        opacity: 1,
      };
  }
}

/**
 * Styled dice number component for the roll history grid.
 * Font weight, size and color change based on dice value to indicate probability:
 * - 2, 12: Lightest, smallest (1/36 probability)
 * - 3, 11: Very light, small (2/36 probability)
 * - 4, 10: Light, slightly small (3/36 probability)
 * - 5, 9: Medium, near normal (4/36 probability)
 * - 6, 8: Very bold, red, larger (5/36 probability) - most desirable
 * - 7: Normal weight, dimmed, normal size (6/36 probability - most common)
 */
export function DiceNumber({ value, variant = "default" }: DiceNumberProps) {
  const style = getDiceStyle(value, variant);

  return (
    <Typography
      variant="body1"
      sx={{
        fontWeight: style.fontWeight,
        fontSize: style.fontSize,
        color: style.color,
        opacity: style.opacity,
      }}
    >
      {value}
    </Typography>
  );
}
