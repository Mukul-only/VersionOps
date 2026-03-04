import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute, PublicRoute, RbacRoute } from "./components/auth/RouteGuards";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
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
                      <Route
                        path="/"
                        element={
                          <RbacRoute path="/">
                            <Dashboard />
                          </RbacRoute>
                        }
                      />
                      <Route
                        path="/participants"
                        element={
                          <RbacRoute path="/participants">
                            <Participants />
                          </RbacRoute>
                        }
                      />
                      <Route
                        path="/participants/add"
                        element={
                          <RbacRoute path="/participants/add">
                            <AddParticipant />
                          </RbacRoute>
                        }
                      />
                      <Route
                        path="/colleges"
                        element={
                          <RbacRoute path="/colleges">
                            <Colleges />
                          </RbacRoute>
                        }
                      />
                      <Route
                        path="/colleges/add"
                        element={
                          <RbacRoute path="/colleges/add">
                            <AddCollege />
                          </RbacRoute>
                        }
                      />
                      <Route
                        path="/events"
                        element={
                          <RbacRoute path="/events">
                            <Events />
                          </RbacRoute>
                        }
                      />
                      <Route
                        path="/events/add"
                        element={
                          <RbacRoute path="/events/add">
                            <AddEvent />
                          </RbacRoute>
                        }
                      />
                      <Route
                        path="/events/edit/:id"
                        element={
                          <RbacRoute path="/events/edit/:id">
                            <AddEvent />
                          </RbacRoute>
                        }
                      />
                      <Route
                        path="/results"
                        element={
                          <RbacRoute path="/results">
                            <Results />
                          </RbacRoute>
                        }
                      />
                      <Route
                        path="/leaderboard"
                        element={
                          <RbacRoute path="/leaderboard">
                            <Leaderboard />
                          </RbacRoute>
                        }
                      />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
