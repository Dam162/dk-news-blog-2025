import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  Home,
  Dashboard,
  Profile,
  SignIn,
  SignUp,
  CreateBlog,
  Admin,
  ForgotPassword,
  PageNotFound,
  EmailVerify,
  Favourites,
  BlogDetails,
} from "../pages";

function RouterConfig() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-blog" element={<CreateBlog />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/email-verify" element={<EmailVerify />} />
          <Route path="/favourites" element={<Favourites />} />
          <Route path="/blog-details/:id" element={<BlogDetails />} />
          <Route path="/page-not-found" element={<PageNotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default RouterConfig;
