import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Footer } from "../../components";

import "./index.css";
import NavBar from "../../components/navbar";
import { CardDesignHome } from "../../components";
import { styled } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  doc,
  getDoc,
} from "firebase/firestore";

const Home = () => {
  const location = useLocation();
  const searchQuery = location.state?.searchQuery?.toLowerCase() || "";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const db = getFirestore();
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "createPost-dk-news-blog"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchData = async () => {
        const newBlogs = [];

        for (const blogRes of querySnapshot.docs) {
          const blogData = blogRes?.data();
          const userID = blogData?.userID;

          let userData = {};
          if (userID) {
            const userRef = doc(db, "users-dk-news-blog", userID);
            const userSnap = await getDoc(userRef);
            if (userSnap?.exists()) {
              userData = userSnap.data();
            } else {
              console.warn(`User document not found for userID: ${userID}`);
            }
          }

          newBlogs.push({ ...blogData, ...userData });
        }

        setData(newBlogs);
        setLoading(false);
      };

      fetchData().catch((err) => {
        console.error("Error fetching blogs:", err);
        setLoading(false);
      });
      window.history.replaceState({}, document.title);
    });

    return () => unsubscribe();
  }, [db]);

  // console.log("blogData:", data);
  const filteredData = data.filter((val) =>
    val.blogTitle?.toLowerCase().includes(searchQuery)
  );

  return (
    <div className="home-container">
      <NavBar />
      <div className="nav-spacer"></div>

      <div className="home-section">
        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={2} style={{ padding: "15px" }}>
            {loading ? (
              // Skeletons (18)
              Array.from(new Array(18)).map((_, index) => (
                <Grid
                  item
                  key={index}
                  size={{ xl: 2, lg: 3, md: 4, sm: 6, xs: 12 }}
                >
                  <CardDesignHome loading={true} />
                </Grid>
              ))
            ) : filteredData.length > 0 ? (
              // Actual data
              // data.map((val, index) => (
              //   <Grid
              //     item
              //     key={index}
              //     size={{ xl: 2, lg: 3, md: 4, sm: 6, xs: 12 }}
              //   >
              //     <CardDesignHome loading={false} data={val} />
              //   </Grid>
              // ))
              filteredData.map((val, index) => (
                <Grid
                  item
                  key={index}
                  size={{ xl: 2, lg: 3, md: 4, sm: 6, xs: 12 }}
                >
                  <CardDesignHome loading={false} data={val} />
                </Grid>
              ))
            ) : (
              // Data not found
              <Box
                sx={{ "& > :not(style)": { width: "100%" } }}
                className="data-not-found"
              >
                <h1 style={{ textAlign: "center" }}>Data Not Found!</h1>
              </Box>
            )}
          </Grid>
        </Box>
      </div>
        <div className="FooterHome">
          <Footer />
        </div>
    </div>
  );
};

export default Home;
