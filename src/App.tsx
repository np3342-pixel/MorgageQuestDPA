/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AgentDashboard from "./pages/AgentDashboard";
import LenderDashboard from "./pages/LenderDashboard";
import BorrowerIntake from "./pages/BorrowerIntake";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import LeadProfile from "./pages/LeadProfile";
import AgentProperties from "./pages/AgentProperties";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/agent" element={<AgentDashboard />} />
        <Route path="/agent/properties" element={<AgentProperties />} />
        <Route path="/lender" element={<LenderDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/lead/:id" element={<LeadProfile />} />
        <Route path="/apply/:agentId" element={<BorrowerIntake />} />
      </Routes>
    </BrowserRouter>
  );
}
