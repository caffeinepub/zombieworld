import { Game } from "./components/game/Game";

export default function App() {
  return (
    <div
      className="w-screen h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "#060508" }}
    >
      <div
        className="relative w-full overflow-hidden rounded-lg"
        style={{
          maxWidth: "720px",
          aspectRatio: "16/9",
          maxHeight: "calc(100vh - 32px)",
        }}
      >
        <Game />
      </div>
    </div>
  );
}
