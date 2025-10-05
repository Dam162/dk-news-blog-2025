import React from "react";
import "./index.css";
import NavBar from "../../components/navbar";
import CreatePost from "../../components/create-post";
import { Footer } from "../../components";

const CreateBlog = () => {
  return (
    <div className="createBlog-container">
      <NavBar />

      {/* Spacer for fixed navbar */}
      <div className="nav-spacer"></div>

      {/* Section below navbar */}
      <div className="createBlog-section">
        <CreatePost className="createPost" />
        <div className="FooterCreateBlog">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default CreateBlog;
