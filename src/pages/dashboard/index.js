import React from "react";
import "./index.css";
import NavBar from "../../components/navbar";

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <NavBar />

      {/* Spacer for fixed navbar */}
      <div className="nav-spacer"></div>

      {/* Section below navbar */}
      <div className="dashboard-section">
        <h2>Dashboard Section</h2>
        <p>This section is the same width as the navbar.</p>
      </div>
    </div>
  );
};

export default Dashboard;
