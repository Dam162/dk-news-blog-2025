import React from "react";
import "./index.css";
import NavBar from "../../components/navbar";
import { UserProfile, Footer } from "../../components";

const Profile = () => {
  return (
    <div className="profile-container">
      <NavBar />

      {/* Spacer for fixed navbar */}
      <div className="nav-spacer"></div>

      {/* Section below navbar */}
      <div className="profile-section">
        <div className="user-profile-sec">
          <UserProfile />
        </div>
        <div className="FooterProfile">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Profile;
