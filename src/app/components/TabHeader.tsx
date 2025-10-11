import { AppBar, Toolbar, Typography, Chip } from "@mui/material";

interface TabHeaderProps {
  currentTurn: string | undefined;
  nextTurn: string;
  players: string[];
  rollsLength: number;
}

export function TabHeader(props: TabHeaderProps) {
  // Calculate the player after nextTurn
  const nextNextPlayerIndex = (props.rollsLength + 1) % props.players.length;
  const nextNextTurn = props.players[nextNextPlayerIndex];

  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Toolbar variant="dense" sx={{ minHeight: 48, gap: 1 }}>
        <Typography variant="body2" sx={{ color: "text.secondary", mr: 1 }}>
          Am Zug:
        </Typography>
        <Chip
          label={props.nextTurn}
          color="primary"
          size="small"
          sx={{ fontWeight: "bold" }}
        />

        <Typography
          variant="body2"
          sx={{ color: "text.secondary", ml: 2, mr: 1 }}
        >
          Danach:
        </Typography>
        <Chip
          label={nextNextTurn}
          variant="outlined"
          size="small"
          sx={{ opacity: 0.7 }}
        />
      </Toolbar>
    </AppBar>
  );
}
