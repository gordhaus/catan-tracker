"use client";

import { CssBaseline } from "@mui/material";
import React from "react";

export function MuiProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {mounted && <CssBaseline />}
      {children}
    </>
  );
}
