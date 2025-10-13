import { State } from "./components/App";

const LOCAL_STORAGE_KEY = "catan:state";

/**
 * Migrates old state format to current format.
 * Adds diceState field if missing (for users with old saved games).
 */
function migrateState(parsedState: any): State {
  // If diceState is missing, this is an old save - default to real-life mode
  if (!parsedState.diceState) {
    return {
      ...parsedState,
      diceState: { mode: "real-life" },
    };
  }
  return parsedState as State;
}

export function getState(): State {
  const storedState = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (storedState === null) {
    return {
      settlements: [],
      players: [],
      rolls: [],
      diceState: { mode: "real-life" },
    };
  }

  try {
    const parsedState = JSON.parse(storedState);
    const migratedState = migrateState(parsedState);
    // Save migrated state back to localStorage to update it
    if (!parsedState.diceState) {
      saveState(migratedState);
    }
    return migratedState;
  } catch (error) {
    console.error("Failed to parse stored state:", error);
    // Return default state if parsing fails
    return {
      settlements: [],
      players: [],
      rolls: [],
      diceState: { mode: "real-life" },
    };
  }
}

export function saveState(state: State): void {
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
}

export function deleteSession() {
  window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  window.location.reload();
}

export function downloadState() {
  const date = new Date();
  const name = `catan_data_${date.getDate()}.${
    date.getMonth() + 1
  }.${date.getFullYear()}.json`;
  const blob = new Blob(
    [window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? ""],
    {
      type: "application/json",
    }
  );
  const fileURL = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = fileURL;
  downloadLink.download = name;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  URL.revokeObjectURL(fileURL);
}

export function importState(json: string) {
  try {
    const parsedState = JSON.parse(json);
    const migratedState = migrateState(parsedState);
    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify(migratedState)
    );
    window.location.reload();
  } catch (error) {
    console.error("Failed to import state:", error);
    alert("Fehler beim Importieren der Datei. Bitte überprüfen Sie das Format.");
  }
}
