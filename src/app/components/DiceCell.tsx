import { Paper, SxProps, Theme } from "@mui/material";

interface DiceCellProps {
  children: React.ReactNode;
  size?: number;
  onClick?: () => void;
  sx?: SxProps<Theme>;
}

/**
 * Reusable dice cell component with consistent square styling and rounded corners.
 * Used for both roll history cells and dice selection buttons.
 */
export function DiceCell({
  children,
  size = 48,
  onClick,
  sx = {},
}: DiceCellProps) {
  const isClickable = !!onClick;

  return (
    <Paper
      elevation={isClickable ? 2 : 0}
      onClick={onClick}
      sx={{
        width: `${size}px`,
        height: `${size}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 2,
        position: "relative",
        ...(isClickable && {
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "scale(1.05)",
          },
          "&:active": {
            transform: "scale(0.95)",
          },
        }),
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}
