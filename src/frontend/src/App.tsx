import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { PaymentFailure } from "./components/PaymentFailure";
import { PaymentGate } from "./components/PaymentGate";
import { PaymentSuccess } from "./components/PaymentSuccess";
import { StripeAdmin } from "./components/StripeAdmin";
import { Game } from "./components/game/Game";

// ─── Root layout ───────────────────────────────────────────────────────────────
function RootLayout() {
  return (
    <>
      <Outlet />
      {/* StripeAdmin floating gear — shown only to admins on all routes */}
      <StripeAdmin />
    </>
  );
}

// ─── Game page (wrapped in payment gate) ──────────────────────────────────────
function GamePage() {
  return (
    <div
      className="w-screen h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "#060508" }}
    >
      <PaymentGate>
        <div
          className="relative w-full overflow-hidden rounded-lg"
          style={{
            maxWidth: "560px",
            aspectRatio: "16/9",
            maxHeight: "calc(100vh - 32px)",
          }}
        >
          <Game />
        </div>
      </PaymentGate>
    </div>
  );
}

// ─── Payment success page ──────────────────────────────────────────────────────
function PaymentSuccessPage() {
  const navigate = useNavigate();
  return <PaymentSuccess onPlay={() => navigate({ to: "/" })} />;
}

// ─── Payment failure page ──────────────────────────────────────────────────────
function PaymentFailurePage() {
  const navigate = useNavigate();
  return <PaymentFailure onRetry={() => navigate({ to: "/" })} />;
}

// ─── Router setup ─────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: GamePage,
});

const paymentSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payment-success",
  component: PaymentSuccessPage,
});

const paymentFailureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payment-failure",
  component: PaymentFailurePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  paymentSuccessRoute,
  paymentFailureRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
