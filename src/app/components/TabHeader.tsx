interface TabHeaderProps {
  currentTurn: string | undefined;
  nextTurn: string;
}

export function TabHeader(props: TabHeaderProps) {
  return (
    <>
      {props.currentTurn && <h1>{`Am Zug: ${props.currentTurn}`}</h1>}
      <h2>{`Nächster Zug: ${props.nextTurn}`}</h2>
    </>
  );
}
