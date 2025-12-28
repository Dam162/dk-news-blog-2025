// import React, { useEffect, useState } from "react";
// import { Avatar, Box, Button, Input, Typography } from "@mui/joy";
// import moment from "moment";
// import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
// import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
// import ThumbDownAltOutlinedIcon from "@mui/icons-material/ThumbDownAltOutlined";
// import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
// import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import Popover from "@mui/material/Popover";
// import UserProfileCard from "../prof-card-hover";

// export default function CommentThread({ currentUserData, data }) {
//   const userCommentsData = data?.comment;
//   console.log("data", data?.comment);
//   console.log("currenuser data", currentUserData);
//   const db = getFirestore();
//   const auth = getAuth();
//   const [comments, setComments] = useState([]);
//   const [replyBox, setReplyBox] = useState(null);
//   const [replyText, setReplyText] = useState("");
//   const [loadingReply, setLoadingReply] = useState(false);
//   const [loadingLike, setLoadingLike] = useState(false);
//   const [liked, setLiked] = useState(false);
//   const [disliked, setDisliked] = useState(false);
//   const [profileAnchor, setProfileAnchor] = useState(null);
//   const profileOpen = Boolean(profileAnchor);

//   useEffect(() => {
//     const fetchData = async () => {
//       let commentsData = [];
//       for (let index in userCommentsData) {
//         const docRef = doc(
//           db,
//           "users-dk-news-blog",
//           userCommentsData[index]?.userID
//         );
//         const docSnap = await getDoc(docRef);

//         if (docSnap.exists()) {
//           console.log("Document data:", docSnap.data());
//           commentsData.push({
//             ...userCommentsData[index],
//             ...docSnap.data(),
//             blogID: userCommentsData[index].uid,
//           });
//           setComments(commentsData);
//         }
//       }
//     };
//     fetchData();
//   }, [data, db]);
//   let sortComments = comments?.sort(
//     (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
//   );
//   const handleProfileClick = (event) => {
//     setProfileAnchor(event.currentTarget);
//   };
//   const handleProfileClose = () => {
//     setProfileAnchor(null);
//   };

//   return (
//     <Box>
//       {sortComments.map((item, index) => {
//         // const path = [i];
//         // const liked = c.likes?.includes(currentUserUid);
//         // const disliked = c.dislikes?.includes(currentUserUid);

//         return (
//           <Box
//             key={index}
//             sx={{
//               display: "flex",
//               flexDirection: "column",
//               // borderLeft: depth > 0 ? "1px solid #ddd" : "none",
//               // pl: depth > 0 ? 1.5 : 0,
//               mt: 2,
//             }}
//           >
//             {/* Comment Header */}
//             <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
//               <Avatar
//                 src={item?.profileImageUrl || ""}
//                 size="sm"
//                 alt={item?.name}
//                 onClick={handleProfileClick}
//                 sx={{ cursor: "pointer" }}
//               >
//                 {!item?.profileImageUrl &&
//                   (item?.name ? item?.name[0].toUpperCase() : "U")}
//               </Avatar>

//               <Box sx={{ flex: 1 }}>
//                 <Typography
//                   sx={{ fontWeight: "bold", fontSize: "sm", cursor: "pointer" }}
//                   onClick={handleProfileClick}
//                 >
//                   {item?.name || "Anonymous"}
//                 </Typography>
//                 <Typography sx={{ fontSize: "xs", color: "text.tertiary" }}>
//                   {moment(item?.commentedAt).fromNow()}
//                 </Typography>

//                 <Typography sx={{ fontSize: "sm", mt: 0.5 }}>
//                   {item?.comment}
//                 </Typography>

//                 {/* 👇 Popover for User Profile */}
//                 <Popover
//                   open={profileOpen}
//                   anchorEl={profileAnchor}
//                   onClose={handleProfileClose}
//                   disablePortal // ✅ prevent re-parenting outside card
//                   disableScrollLock // ✅ page scroll lock hatao
//                   anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
//                   transformOrigin={{ vertical: "top", horizontal: "left" }}
//                   PaperProps={{
//                     sx: {
//                       boxShadow: 3,
//                       borderRadius: 2,
//                     },
//                   }}
//                 >
//                   <UserProfileCard data={data} className="user-profile-card" />
//                 </Popover>

//                 {/* Buttons: Like / Dislike / Reply */}
//                 <Box
//                   sx={{
//                     display: "flex",
//                     alignItems: "center",
//                     gap: 2,
//                     mt: 0.8,
//                   }}
//                 >
//                   <Button
//                     size="sm"
//                     variant="plain"
//                     startDecorator={
//                       liked ? (
//                         <ThumbUpAltIcon fontSize="small" color="primary" />
//                       ) : (
//                         <ThumbUpAltOutlinedIcon fontSize="small" />
//                       )
//                     }
//                     sx={{ fontSize: "xs", px: 0 }}
//                     // onClick={() => handleLikeDislike(path, "like")}
//                     disabled={loadingLike}
//                   >
//                     {index?.likes?.length || 0}
//                   </Button>

//                   <Button
//                     size="sm"
//                     variant="plain"
//                     startDecorator={
//                       disliked ? (
//                         <ThumbDownAltIcon fontSize="small" color="error" />
//                       ) : (
//                         <ThumbDownAltOutlinedIcon fontSize="small" />
//                       )
//                     }
//                     sx={{ fontSize: "xs", px: 0 }}
//                     // onClick={() => handleLikeDislike(path, "dislike")}
//                     disabled={loadingLike}
//                   >
//                     {index?.dislikes?.length || 0}
//                   </Button>

//                   <Button
//                     size="sm"
//                     variant="plain"
//                     sx={{ fontSize: "xs", px: 0 }}
//                     onClick={() =>
//                       setReplyBox(replyBox === index ? null : index)
//                     }
//                   >
//                     Reply
//                   </Button>
//                 </Box>

//                 {/* Reply Input Box */}
//                 {replyBox === index && (
//                   <Box
//                     sx={{
//                       display: "flex",
//                       alignItems: "center",
//                       gap: 1,
//                       mt: 1.5,
//                       width: "100%",
//                       flexWrap: "wrap",
//                     }}
//                   >
//                     {/* Current user avatar */}
//                     <Avatar
//                       src={currentUserData?.profileImageUrl || ""}
//                       size="sm"
//                     >
//                       {!currentUserData?.profileImageUrl &&
//                         (currentUserData?.name
//                           ? currentUserData?.name[0].toUpperCase()
//                           : "U")}
//                     </Avatar>

//                     <Input
//                       fullWidth
//                       variant="outlined"
//                       placeholder="Write a reply..."
//                       size="sm"
//                       value={replyText}
//                       onChange={(e) => setReplyText(e.target.value)}
//                       sx={{
//                         flex: 1,
//                         minWidth: "200px",
//                       }}
//                     />
//                     <Button
//                       size="sm"
//                       disabled={!replyText || loadingReply}
//                       // onClick={() => handleReplySubmit(path)}
//                     >
//                       {loadingReply ? "Replying..." : "Reply"}
//                     </Button>
//                   </Box>
//                 )}
//               </Box>
//             </Box>
//           </Box>
//         );
//       })}
//     </Box>
//   );
// }

import React, { useEffect, useState } from "react";
import { Avatar, Box, Button, Input, Typography } from "@mui/joy";
import moment from "moment";
import Popover from "@mui/material/Popover";
import UserProfileCard from "../prof-card-hover";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  ThumbUpAltOutlined as LikeOutline,
  ThumbDownAltOutlined as DislikeOutline,
  ThumbUpAlt as LikeFilled,
  ThumbDownAlt as DislikeFilled,
} from "@mui/icons-material";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function CommentThread({ currentUserData, postId }) {
  const db = getFirestore();
  const auth = getAuth();
  console.log(currentUserData, "currentUserData in comment thread");

  const [data, setData] = useState(null); // full post data with uid
  const [comments, setComments] = useState([]);
  const [currentUserUid, setCurrentUserUid] = useState(null);
  const [replyState, setReplyState] = useState({});
  const [replyText, setReplyText] = useState({});
  const [loading, setLoading] = useState(true);

  const [profileAnchor, setProfileAnchor] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const profileOpen = Boolean(profileAnchor);

  // 🔹 Auth state
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) setCurrentUserUid(user.uid);
    });
  }, []);

  // 🔹 Fetch post data
  useEffect(() => {
    if (!postId) return;

    const postRef = doc(db, "createPost-dk-news-blog", postId);

    const unsubscribe = onSnapshot(postRef, async (snap) => {
      if (!snap.exists()) return;

      const postData = { uid: snap.id, ...snap.data() };
      setData(postData);

      const commentsData = [];

      for (let c of postData.comment || []) {
        const userSnap = await getDoc(doc(db, "users-dk-news-blog", c.userID));

        commentsData.push({
          ...c,
          ...(userSnap.exists() ? userSnap.data() : {}),
          replyComments: c.replyComments || [],
        });
      }

      setComments(commentsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  // 🔹 Helper to get target comment by path
  const getTargetByPath = (arr, path) =>
    path.reduce((obj, key) => obj?.[key], arr);

  const handleProfileClick = (event, userData) => {
    setProfileAnchor(event.currentTarget);
    setSelectedUser(userData);
  };

  const handleProfileClose = () => {
    setProfileAnchor(null);
  };

  // 🔹 Like / Dislike
  const handleLikeDislike = async (path, type) => {
    if (!currentUserUid || !data?.uid) return;

    const postRef = doc(db, "createPost-dk-news-blog", data.uid);
    const updated = [...comments];
    const target = getTargetByPath(updated, path);
    if (!target) return;

    const likes = target.likes || [];
    const dislikes = target.dislikes || [];

    if (type === "like") {
      if (likes.includes(currentUserUid)) {
        target.likes = likes.filter((id) => id !== currentUserUid);
      } else {
        target.likes = [...likes, currentUserUid];
        target.dislikes = dislikes.filter((id) => id !== currentUserUid);
      }
    } else {
      if (dislikes.includes(currentUserUid)) {
        target.dislikes = dislikes.filter((id) => id !== currentUserUid);
      } else {
        target.dislikes = [...dislikes, currentUserUid];
        target.likes = likes.filter((id) => id !== currentUserUid);
      }
    }

    setComments(updated);
    try {
      await updateDoc(postRef, { comment: updated });
    } catch (err) {
      console.error("Firestore update error:", err);
    }
  };

  // 🔹 Reply submit
  const handleReply = async (path) => {
    if (!data?.uid || !currentUserUid) return;

    const key = path.join("-");
    const text = replyText[key]?.trim();
    if (!text) return;

    const postRef = doc(db, "createPost-dk-news-blog", data.uid);
    const updated = [...comments];
    const target = getTargetByPath(updated, path);
    if (!target) return;

    const newReply = {
      userID: currentUserUid,
      name: currentUserData?.name || "Anonymous",
      profileImageUrl: currentUserData?.profileImageUrl || "",
      comment: text,
      commentedAt: Date.now(),
      likes: [],
      dislikes: [],
      replyComments: [],
    };

    target.replyComments = [...(target.replyComments || []), newReply];
    setComments(updated);

    try {
      await updateDoc(postRef, { comment: updated });
    } catch (err) {
      console.error("Firestore update error:", err);
    }

    setReplyText((prev) => ({ ...prev, [key]: "" }));
    setReplyState((prev) => ({ ...prev, [key]: false }));
  };

  // 🔹 Recursive comment renderer
  const renderComment = (item, path = []) => {
    const pathKey = path.join("-");
    const liked = item.likes?.includes(currentUserUid);
    const disliked = item.dislikes?.includes(currentUserUid);

    return (
      <Box
        key={pathKey}
        sx={{
          mt: 1,
          // ml: path.length > 0 ? 4 : 0,
          borderLeft: path.length > 0 ? "1px solid #cecbcbff" : "none",
          padding: path.length > 0 ? 1 : 0,
          borderRadius: path.length > 0 ? 10 : 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
          }}
        >
          <Avatar
            src={item?.profileImageUrl || ""}
            size="sm"
            onClick={(e) => handleProfileClick(e, item)}
            sx={{ cursor: "pointer" }}
          >
            {!item?.profileImageUrl &&
              (item?.name ? item.name[0].toUpperCase() : "U")}
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Typography
              fontWeight="bold"
              fontSize="sm"
              onClick={(e) => handleProfileClick(e, item)}
              sx={{ cursor: "pointer" }}
            >
              {item?.name || "Anonymous"}
            </Typography>

            <Typography fontSize="xs" color="text.tertiary">
              {moment(item?.commentedAt).fromNow()}
            </Typography>
            <Typography fontSize="sm" sx={{ mt: 0.5 }}>
              {item.comment}
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap", // allows items to move to next line on small screens
                alignItems: "center",
                gap: 1, // use smaller gap for mobile
                mt: 0.8,
              }}
            >
              <Button
                size="sm"
                variant="plain"
                startDecorator={
                  liked ? (
                    <LikeFilled fontSize="small" color="primary" />
                  ) : (
                    <LikeOutline fontSize="small" />
                  )
                }
                onClick={() => handleLikeDislike(path, "like")}
              >
                {item.likes?.length || 0}
              </Button>

              <Button
                size="sm"
                variant="plain"
                startDecorator={
                  disliked ? (
                    <DislikeFilled fontSize="small" color="error" />
                  ) : (
                    <DislikeOutline fontSize="small" />
                  )
                }
                onClick={() => handleLikeDislike(path, "dislike")}
              >
                {item.dislikes?.length || 0}
              </Button>

              <Button
                size="sm"
                variant="plain"
                sx={{ fontSize: { xs: "10px", sm: "12px" } }} // smaller font on mobile
                onClick={() =>
                  setReplyState((prev) => ({
                    ...prev,
                    [pathKey]: !prev[pathKey],
                  }))
                }
              >
                Reply
              </Button>
            </Box>

            {replyState[pathKey] && (
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}
              >
                <Avatar
                  src={currentUserData?.profileImageUrl || ""}
                  size="sm"
                />
                <Input
                  size="sm"
                  placeholder="Write a reply..."
                  value={replyText[pathKey] || ""}
                  onChange={(e) =>
                    setReplyText((prev) => ({
                      ...prev,
                      [pathKey]: e.target.value,
                    }))
                  }
                  sx={{ flex: 1 }}
                />
                <Button
                  sx={{ borderRadius: 2 }}
                  size="sm"
                  onClick={() => handleReply(path)}
                >
                  Reply
                </Button>
              </Box>
            )}

            {(item.replyComments || []).map((rep, i) =>
              renderComment(rep, [...path, "replyComments", i])
            )}
          </Box>
          {/* 👇 Popover for User Profile */}
          <Popover
            open={profileOpen}
            anchorEl={profileAnchor}
            onClose={() => {
              setProfileAnchor(null);
              setSelectedUser(null);
            }}
            disablePortal
            disableScrollLock
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            PaperProps={{ sx: { boxShadow: 0, borderRadius: 2 } }}
          >
            {selectedUser && <UserProfileCard data={selectedUser} />}
          </Popover>
        </Box>
      </Box>
    );
  };

  if (loading) return <Typography>Loading comments...</Typography>;
  if (!data?.uid) return <Typography>Post not found</Typography>;

  return <Box>{comments.map((c, i) => renderComment(c, [i]))}</Box>;
}
