import {
  AppBar,
  Toolbar,
  Typography,
  Chip,
  IconButton,
  MenuItem,
  Box,
  Popper,
  Grow,
  Paper,
  MenuList,
  ClickAwayListener,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useState, useRef, useEffect } from "react";

interface TabHeaderProps {
  currentTurn: string | undefined;
  nextTurn: string;
  onExport: () => void;
  onNewSession: () => void;
}

export function TabHeader(props: TabHeaderProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpen(false);
  };

  function handleListKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  // return focus to the button when we transitioned from !open -> open
  const prevOpen = useRef(open);
  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current!.focus();
    }

    prevOpen.current = open;
  }, [open]);

  const handleExport = (event: Event | React.SyntheticEvent) => {
    props.onExport();
    handleClose(event);
  };

  const handleNewSession = (event: Event | React.SyntheticEvent) => {
    props.onNewSession();
    handleClose(event);
  };

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

        {/* Spacer to push menu to the right */}
        <Box sx={{ flexGrow: 1 }} />

        <IconButton
          ref={anchorRef}
          edge="end"
          color="inherit"
          aria-label="menu"
          aria-controls={open ? "composition-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleToggle}
        >
          <MenuIcon />
        </IconButton>

        <Popper
          open={open}
          anchorEl={anchorRef.current}
          role={undefined}
          placement="bottom-end"
          transition
          disablePortal
        >
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              style={{
                transformOrigin:
                  placement === "bottom-end" ? "right top" : "right bottom",
              }}
            >
              <Paper>
                <ClickAwayListener onClickAway={handleClose}>
                  <MenuList
                    autoFocusItem={open}
                    id="composition-menu"
                    aria-labelledby="composition-button"
                    onKeyDown={handleListKeyDown}
                  >
                    <MenuItem onClick={handleExport}>Exportieren</MenuItem>
                    <MenuItem onClick={handleNewSession}>Neue Session</MenuItem>
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </Toolbar>
    </AppBar>
  );
}
