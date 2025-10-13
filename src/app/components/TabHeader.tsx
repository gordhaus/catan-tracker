import { AppBar, Toolbar, Typography, Chip } from "@mui/material";

interface TabHeaderProps {
  currentTurn: string | undefined;
  nextTurn: string;
}

export function TabHeader(props: TabHeaderProps) {
  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Toolbar variant="dense" sx={{ minHeight: 48, gap: 1 }}>
        {props.currentTurn !== undefined && (
          <>
            <Typography variant="body2" sx={{ color: "text.secondary", mr: 1 }}>
              Am Zug:
            </Typography>
            <Chip
              label={props.currentTurn}
              color="primary"
              size="small"
              sx={{ fontWeight: "bold" }}
            />
          </>
        )}
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", ml: 2, mr: 1 }}
        >
          Nächster:
        </Typography>
        <Chip
          label={props.nextTurn}
          variant="outlined"
          size="small"
          sx={{ opacity: 0.7 }}
        />
      </Toolbar>
    </AppBar>
  );
}
