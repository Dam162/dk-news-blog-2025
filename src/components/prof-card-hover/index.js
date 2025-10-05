import React, { useState, useEffect } from "react";
import AspectRatio from "@mui/joy/AspectRatio";
import Button from "@mui/joy/Button";
import Card from "@mui/joy/Card";
import CardActions from "@mui/joy/CardActions";
import Typography from "@mui/joy/Typography";
import BakeryDiningIcon from "@mui/icons-material/BakeryDining";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CardContent from "@mui/joy/CardContent";
import { doc, updateDoc, getDoc, getFirestore } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import BasicModal from "../basic-model";

export default function UserProfileCard({ data }) {
  const [userData, setUserData] = useState(data);
  const [currentUserUid, setCurrentUserUid] = useState(null);
  const [alreadyLogin, setAlreadyLogin] = useState(false);
  const isFollowing = userData?.followers?.includes(currentUserUid);
  const db = getFirestore();
  const auth = getAuth();
  const [modelOpen, setModelOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserUid(user.uid);
        setAlreadyLogin(true);

        // Fetch latest user data
        if (data?.userID) {
          const userDoc = await getDoc(
            doc(db, "users-dk-news-blog", data?.userID)
          );
          if (userDoc?.exists()) {
            const fetchedData = { ...userDoc?.data(), userID: userDoc?.id };
            setUserData(fetchedData);
          }
        }
      } else {
        setCurrentUserUid(null);
        setAlreadyLogin(false);
      }
    });

    return () => unsubscribe();
  }, [auth, data?.userID, db]);

  // const handleFollow = async () => {
  //   if (alreadyLogin) {
  //     let followers = userData?.followers || [];
  //     let isFollowed = followers?.includes(currentUserUid);
  //     if (isFollowed) {
  //       // remove
  //       for (let index in followers) {
  //         if (followers[index] === currentUserUid) {
  //           followers.splice(index, 1);
  //           break;
  //         }
  //       }
  //     } else {
  //       // add
  //       followers.push(currentUserUid);
  //     }
  //     // update data
  //     const blogRef = doc(db, "users-dk-news-blog", userData?.userID);
  //     await updateDoc(blogRef, { followers: followers });
  //   } else {
  //     setModelOpen(true);
  //   }
  // };
  const formatNumber = (count) => {
    if (!count || count === 0) return "0";
    if (count < 1000) return count.toString();
    if (count < 1000000)
      return (count / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    if (count < 1000000000)
      return (count / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    return (count / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
  };

  const handleFollow = async () => {
    if (!alreadyLogin) {
      setModelOpen(true);
      return;
    }

    try {
      let followers = userData?.followers || [];
      let isFollowed = followers.includes(currentUserUid);

      // 🔹 1. Optimistically update local state
      let updatedFollowers;
      if (isFollowed) {
        updatedFollowers = followers.filter((id) => id !== currentUserUid);
      } else {
        updatedFollowers = [...followers, currentUserUid];
      }
      setUserData((prev) => ({ ...prev, followers: updatedFollowers }));

      // 🔹 2. Update in Firestore
      const blogRef = doc(db, "users-dk-news-blog", userData?.userID);
      await updateDoc(blogRef, { followers: updatedFollowers });
    } catch (err) {
      console.error("Follow/Unfollow error:", err);
      // 🔹 Optional: Revert if fails (fetch from db again)
      const userDoc = await getDoc(
        doc(db, "users-dk-news-blog", userData?.userID)
      );
      if (userDoc.exists()) {
        setUserData({ ...userDoc.data(), userID: userDoc.id });
      }
    }
  };

  return (
    <Card
      sx={{
        padding: 1,
        textAlign: "center",
        alignItems: "center",
        mx: "auto",
        overflow: "hidden",
      }}
    >
      {/* 🔹 Cover Image */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100px",
          borderTopLeftRadius: "inherit",
          borderTopRightRadius: "inherit",
        }}
      >
        {userData?.coverImageUrl ? (
          <img
            src={userData.coverImageUrl}
            alt="Cover"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderTopLeftRadius: "inherit",
              borderTopRightRadius: "inherit",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #FFD54F, #FFB300)",
            }}
          />
        )}

        {/* 🔹 Profile Image */}
        <AspectRatio
          ratio="1"
          sx={{
            borderRadius: "50%",
            width: { xs: "50px", sm: "65px", md: "75px" },
            height: { xs: "50px", sm: "65px", md: "75px" },
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            position: "absolute",
            bottom: "-35%",
            left: "50%",
            transform: "translateX(-50%)",
            bgcolor: "background.surface",
            border: "3px solid white",
            zIndex: 2,
          }}
        >
          {userData?.profileImageUrl ? (
            <img
              src={userData.profileImageUrl}
              alt={userData?.name || "User"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          ) : (
            <BakeryDiningIcon color="warning" sx={{ fontSize: "1.8rem" }} />
          )}
        </AspectRatio>
      </div>

      {/* ✅ User Info */}
      <CardContent sx={{ mt: 4 }}>
        <Typography
          level="title-lg"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
          }}
        >
          {userData?.name || "User"}
          {userData?.appliedForVerified && (
            <CheckCircleIcon sx={{ color: "#2196f3", fontSize: "1.2rem" }} />
          )}
        </Typography>
        <Typography level="title-md" sx={{ color: "text.secondary" }}>
          {userData?.skill || "Skill"}
        </Typography>
        <Typography
          level="title-sm"
          sx={{
            color: "text.primary",
            backgroundColor: "lightgray",
            padding: "2px",
            borderRadius: "3px",
          }}
        >
          {/* {`Followers: ${userData?.followers?.length}`} */}
          Followers: {formatNumber(userData?.followers?.length || 0)}
        </Typography>
      </CardContent>

      {/* ✅ Extra Info */}
      <CardContent>
        <Typography level="title-sm">
          Father's Name: {userData?.fatherName || "N/A"}
        </Typography>
        <Typography level="title-sm">Age: {userData?.age || "N/A"}</Typography>
        <Typography level="title-sm">
          Gender: {userData?.gender || "N/A"}
        </Typography>
        <Typography level="title-sm">
          Email: {userData?.email || "N/A"}
        </Typography>
      </CardContent>

      {/* ✅ Follow / Unfollow Button */}
      <CardActions orientation="vertical" sx={{ width: "100%", p: 0, m: 0 }}>
        <Button
          variant="solid"
          fullWidth
          onClick={handleFollow}
          disabled={currentUserUid === userData?.userID}
          sx={{
            m: 0, // remove default margin
            bgcolor: isFollowing ? "gray" : "green",
            "&:hover": { bgcolor: isFollowing ? "darkgray" : "darkgreen" },
            color: "white",
          }}
        >
          {isFollowing ? "Unfollow" : "Follow"}
        </Button>
      </CardActions>
      <BasicModal open={modelOpen} handleClose={() => setModelOpen(false)} />
    </Card>
  );
}
