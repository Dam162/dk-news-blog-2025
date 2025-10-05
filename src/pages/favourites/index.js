import React, { useEffect, useState } from "react";
import "./index.css";
import NavBar from "../../components/navbar";
import { Footer } from "../../components";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const Favourites = () => {
  const db = getFirestore();
  const [favouritePosts, setFavouritePosts] = useState([]);

  useEffect(() => {
    const fetchFavourites = async () => {
      const favs = JSON.parse(localStorage.getItem("favourites")) || [];

      if (favs.length === 0) {
        setFavouritePosts([]);
        return;
      }

      const querySnapshot = await getDocs(collection(db, "posts"));
      const posts = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const favPosts = posts.filter((post) => favs.includes(post.id));
      setFavouritePosts(favPosts);
    };

    fetchFavourites();
  }, []);

  return (
    <div className="favourites-container">
      <NavBar />
      <div className="nav-spacer"></div>

      <div className="favourites-section">
        <div className="user-favourites-sec">
          <h1>Favourites</h1>
          {favouritePosts.length === 0 ? (
            <p>No favourites yet</p>
          ) : (
            favouritePosts.map((post) => (
              <div key={post.id} className="fav-post">
                <h3>{post.blogTitle}</h3>
                <p>{post.blogDetails}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="Footer">
        <Footer />
      </div>
    </div>
  );
};

export default Favourites;
