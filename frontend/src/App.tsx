import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute, PublicRoute } from "./components/auth/RouteGuards";
import Dashboard from "./pages/Dashboard";
import Participants from "./pages/Participants";
import AddParticipant from "./pages/AddParticipant";
import Colleges from "./pages/Colleges";
import AddCollege from "./pages/AddCollege";
import Events from "./pages/Events";
import AddEvent from "./pages/AddEvent";
import Results from "./pages/Results";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { PopupProvider } from "./components/popup";
import PopupHandler from "./components/PopupHandler";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PopupProvider>
        <PopupHandler />
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/participants" element={<Participants />} />
                        <Route path="/participants/add" element={<AddParticipant />} />
                        <Route path="/colleges" element={<Colleges />} />
                        <Route path="/colleges/add" element={<AddCollege />} />
                        <Route path="/events" element={<Events />} />
                        <Route path="/events/add" element={<AddEvent />} />
                        <Route path="/events/edit/:id" element={<AddEvent />} />
                        <Route path="/results" element={<Results />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </PopupProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
