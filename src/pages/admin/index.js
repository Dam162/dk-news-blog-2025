import React from "react";
import "./index.css";
import NavBar from "../../components/navbar";

const Admin = () => {
  return (
    <div className="admin-container">
      <NavBar />

      {/* Spacer for fixed navbar */}
      <div className="nav-spacer"></div>

      {/* Section below navbar */}
      <div className="admin-section">
        <h2>Admin Section</h2>
        <p>
          dsfadsf
        </p>
      </div>
    </div>
  );
};

export default Admin;
