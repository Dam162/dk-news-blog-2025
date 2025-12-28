import React, { use, useEffect, useState } from "react";
import "./index.css";
import NavBar from "../../components/navbar";
import { Footer } from "../../components";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import {
  collection,
  query,
  where,
  onSnapshot,
  getFirestore,
  doc,
  getDoc,
} from "firebase/firestore";
import { CardDesignHome } from "../../components";
const Dashboard = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const db = getFirestore();
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState([]);
  const location = useLocation();
  const searchQuery = location.state?.searchQuery?.toLowerCase() || "";

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const uid = user.uid;
        if (user.emailVerified) {
          // User email is verified
          const q = query(
            collection(db, "createPost-dk-news-blog"),
            where("userID", "==", uid)
          );
          const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const newsBlog = [];
            console.log("querySnapshot.docs:", querySnapshot.docs);
            const fetchData = async () => {
              for (const blogRes of querySnapshot.docs) {
                const blogData = blogRes?.data();
                // newsBlog.push(blogData);
                // console.log("blogData:", blogData);
                const userRef = doc(db, "users-dk-news-blog", blogData.userID);
                const userSnap = await getDoc(userRef);
                const userData = userSnap?.data() || {};
                newsBlog.push({ ...blogData, ...userData });
              }
              setBlogs(newsBlog);
              setLoading(false);
            };
            fetchData().catch((err) => {
              console.error("Error fetching blogs:", err);
              setLoading(false);
            });
          });
        } else {
          navigate("/email-verify");
          // User  is not verified
        }
      } else {
        navigate("/");
      }
    });
  }, []);
  // console.log("blogs:", blogs);

  const filteredData = blogs.filter((val) =>
    val.blogTitle?.toLowerCase().includes(searchQuery)
  );
  return (
    <div className="dashboard-container">
      <NavBar />

      {/* Spacer for fixed navbar */}
      <div className="nav-spacer"></div>

      {/* Section below navbar */}
      <div className="dashboard-section">
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
                  <CardDesignHome loading={false} data={val} edit={true} />
                </Grid>
              ))
            ) : (
              // Data not found
              <Box
                sx={{ "& > :not(style)": { width: "100%" } }}
                className="data-not-found-dash"
              >
                <h1 style={{ textAlign: "center" }}>Data Not Found!</h1>
              </Box>
            )}
          </Grid>
        </Box>
      </div>
      <div className="FooterDashboard">
        <Footer />
      </div>
    </div>
  );
};

export default Dashboard;
