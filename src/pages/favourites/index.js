import React, { useEffect, useState } from "react";
import "./index.css";
import NavBar from "../../components/navbar";
import { Footer } from "../../components";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import { getFirestore, doc, getDoc, onSnapshot } from "firebase/firestore";
import { CardDesignHome } from "../../components";

const Favorites = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const db = getFirestore();
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState([]);
  const location = useLocation();
  const searchQuery = location.state?.searchQuery?.toLowerCase() || "";

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const uid = user.uid;

        if (user.emailVerified) {
          // ✅ Real-time listener for user's favorites
          const unsubUser = onSnapshot(
            doc(db, "users-dk-news-blog", uid),
            (docSnap) => {
              if (!docSnap.exists()) {
                console.log("User not found");
                setBlogs([]);
                setLoading(false);
                return;
              }

              const favorites = docSnap.data()?.favorites || [];
              console.log("User favorites (live):", favorites);

              if (favorites.length === 0) {
                setBlogs([]);
                setLoading(false);
                return;
              }

              const fetchData = async () => {
                try {
                  const newsBlog = [];

                  for (const blogId of favorites) {
                    const blogRef = doc(db, "createPost-dk-news-blog", blogId);
                    const blogSnap = await getDoc(blogRef);

                    if (blogSnap.exists()) {
                      const blogData = blogSnap.data();

                      const authorRef = doc(
                        db,
                        "users-dk-news-blog",
                        blogData.userID
                      );
                      const authorSnap = await getDoc(authorRef);
                      const authorData = authorSnap.data() || {};

                      newsBlog.push({ ...blogData, ...authorData });
                    }
                  }

                  // ✅ Instantly update favorites (no reload)
                  setBlogs(newsBlog);
                  setLoading(false);
                } catch (err) {
                  console.error("Error fetching favorite blogs:", err);
                  setLoading(false);
                }
              };

              fetchData();
            }
          );

          // Cleanup on unmount
          return () => unsubUser();
        } else {
          navigate("/email-verify");
        }
      } else {
        navigate("/");
      }
    });

    return () => unsubscribeAuth();
  }, []);

  console.log("blogs:", blogs);

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
              <Box
                sx={{ "& > :not(style)": { width: "100%" } }}
                className="data-not-found-dash"
              >
                <h1 style={{ textAlign: "center" }}>
                  No Favorite Posts Found!
                </h1>
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

export default Favorites;
