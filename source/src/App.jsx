import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Flights from "./pages/Flights";
import RouteMap from "./pages/RouteMap";
import Schedule from "./pages/Schedule";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/flights" element={<Flights />} />
        <Route path="/map" element={<RouteMap />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
