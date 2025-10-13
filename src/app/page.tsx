"use client";

import dynamic from "next/dynamic";

// Disable SSR for the App component to avoid hydration issues with localStorage
const App = dynamic(() => import("./components/App"), {
  ssr: false,
});

export default function Home() {
  return <App />;
}
