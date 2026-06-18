import React from "react";
import "./index.css";
import { Footer } from "../../components";
import NavBar from "../../components/navbar";
import AdminDashboard from "../admin-dashboad";

const Admin = () => {
  return (
    <div className="admin-container">
      {/* <NavBar /> */}
      {/* <div className="nav-spacer"></div> */}
      <div className="admin-section">
        <AdminDashboard />
      </div>
      {/* <div className="footer-admin">
        <Footer />
      </div> */}
    </div>
  );
};

export default Admin;
