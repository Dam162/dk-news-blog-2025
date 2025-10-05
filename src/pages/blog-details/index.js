import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Footer } from "../../components";
import "./index.css";
import NavBar from "../../components/navbar";
import { CardDesignDetails } from "../../components";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, onSnapshot, doc, getDoc } from "firebase/firestore";

const BlogDetails = () => {
  const detailsLoc = useLocation();
  const detailsPath = detailsLoc.pathname.slice(14);
  //   console.log("Blog Details Path ID:", detailsPath);
  console.log("detailsLoc State:", detailsLoc);
  const db = getFirestore();
  const auth = getAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [blogDetailsData, setBlogDetailsData] = useState([]);

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      const unsub = onSnapshot(
        doc(db, "createPost-dk-news-blog", detailsPath),
        async (blogRes) => {
          const blogData = blogRes?.data();
          // console.log("Current data: ", blogRes.data());
          if (blogRes.data()) {
            const userRef = doc(
              db,
              "users-dk-news-blog",
              blogRes?.data()?.userID
            );
            const UserSnap = await getDoc(userRef);
            const userData = UserSnap?.data();
            setBlogDetailsData({ ...blogData, ...userData });
            setLoading(false);
          } else {
            setLoading(false);
            navigate("/");
          }
        }
      );
    });
  }, []);

  return (
    <div className="blogDetails-container">
      <NavBar />
      <div className="blogDetails-nav-spacer"></div>

      <div className="blogDetails-section">
        <CardDesignDetails
          data={blogDetailsData}
          detailsPath={detailsPath}
          loading={loading}
        />
      </div>
      <div className="blogDetails-footer">
        <Footer />
      </div>
    </div>
  );
};

export default BlogDetails;
