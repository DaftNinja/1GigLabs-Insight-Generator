import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Reports from "@/pages/Reports";
import ContactsPage from "@/pages/Contacts";
import PresentationPage from "@/pages/Presentation";
import MissionPage from "@/pages/Mission";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/reports" component={Reports} />
      <Route path="/mission" component={MissionPage} />
      <Route path="/analyze/:id" component={Dashboard} />
      <Route path="/contacts/:id" component={ContactsPage} />
      <Route path="/presentation" component={PresentationPage} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
