import { Game } from "./components/game/Game";

export default function App() {
  return (
    <div
      className="w-screen h-screen overflow-hidden"
      style={{ background: "#060508" }}
    >
      <Game />
    </div>
  );
}
