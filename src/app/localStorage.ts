import { State } from "./components/App";

const LOCAL_STORAGE_KEY = "catan:state";

export function getState(): State {
  const storedState = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  return storedState === null
    ? { settlements: [], players: [], rolls: [] }
    : (JSON.parse(storedState) as State);
}

export function updateState(
  fn: (oldState: State) => State,
  stateUpdate: React.Dispatch<React.SetStateAction<State>>
) {
  const oldState = getState();
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fn(oldState)));
  stateUpdate(getState());
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
  window.localStorage.setItem(LOCAL_STORAGE_KEY, json);
  window.location.reload();
}
