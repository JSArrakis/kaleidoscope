import { MemoryRouter as Router } from "react-router-dom";
import RootStackNavigator from "./navigation/RootStackNavigator";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./App.css";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div
          id="main-container"
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            width: "100%",
          }}
        >
          <RootStackNavigator />
        </div>
      </Router>
    </QueryClientProvider>
  );
}
