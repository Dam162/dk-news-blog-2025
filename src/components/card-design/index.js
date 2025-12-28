import React, { useState, useEffect } from "react";
import AspectRatio from "@mui/joy/AspectRatio";
import Avatar from "@mui/joy/Avatar";
import Box from "@mui/joy/Box";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CardOverflow from "@mui/joy/CardOverflow";
import Link from "@mui/joy/Link";
import IconButton from "@mui/joy/IconButton";
import Input from "@mui/joy/Input";
import Typography from "@mui/joy/Typography";
import Skeleton from "@mui/joy/Skeleton";
import MoreHoriz from "@mui/icons-material/MoreHoriz";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import ModeCommentOutlined from "@mui/icons-material/ModeCommentOutlined";
import SendOutlined from "@mui/icons-material/SendOutlined";
import Face from "@mui/icons-material/Face";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded"; // filled version
import "./index.css";
import CardMedia from "@mui/material/CardMedia";
import { useNavigate, useLocation } from "react-router-dom";
import moment from "moment";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import UserProfileCard from "../prof-card-hover";
import Popover from "@mui/material/Popover";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BasicModal from "../basic-model";
import CircularProgress from "@mui/material/CircularProgress";
import { toast } from "react-toastify";
// MUI Menu Components
import Menu from "@mui/material/Menu";
import { MenuItem, Snackbar } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";

import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import {
  Facebook as FacebookIcon,
  WhatsApp as WhatsappIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedinIcon,
  Telegram as TelegramIcon,
} from "@mui/icons-material";
import EditPostModal from "../edit-open-model";

export default function CardDesignHome({ data, loading, edit }) {
  const location = useLocation();
  console.log("location in card:", location);
  const blogData = data;
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();
  const [modelOpen, setModelOpen] = useState(false);
  const [openEditPostModel, setOpenEditPostModel] = useState(false);
  const [currentUserUid, setCurrentUserUid] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [alreadyLogin, setAlreadyLogin] = useState(false);
  // const [isLiked, setIsLiked] = useState(false);
  const isLiked = blogData?.like?.includes(currentUserUid);
  // const isFavorite = currentUserData?.favorites?.includes(blogData?.blogID);
  const [isFavorite, setIsFavorite] = useState(false);

  // console.log("isFavorite", isFavorite);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // const [userData, setUserData] = useState(null);
  // const [isFavourite, setIsFavourite] = useState(false);
  // const [hoveredUser, setHoveredUser] = useState(null);
  // const [anchorPos, setAnchorPos] = useState(null);

  // console.log("userData in card", userData);
  // console.log("blogData in card", blogData);
  // console.log("currentUserData in card", currentUserData);

  // 🔹 state for profile popover
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const profileOpen = Boolean(profileAnchor);

  // comment box state
  const [comment, setComment] = useState("");
  const [loadingComment, setLoadingComment] = useState(false);

  const [anchorE2, setAnchorE2] = useState(null);
  const open2 = Boolean(anchorE2);
  const [copied, setCopied] = useState(false);

  // ✅ Check if we are on Dashboard page
  const isDashboard = location.pathname.includes("/dashboard");
  console.log("isDashboard:", isDashboard);

  // ✅ Check if logged-in user is author
  const isAuthor = currentUserUid === blogData?.userID;
  console.log("isAuthor:", isAuthor);
  // const shareUrl = `https://dk-news-blog-2025.vercel.app/blog-details/${blogData?.blogID}`;
  const handleOpenSocial = (event) => {
    setAnchorE2(event.currentTarget);
  };

  const handleCloseSocial = () => {
    setAnchorE2(null);
  };

  // shareHandler
  const handleShare = async (platform) => {
    const shareUrl = `https://dk-news-blog-2025.vercel.app/blog-details/${blogData?.blogID}`;
    let url = "";

    switch (platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?url=${shareUrl}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
        break;
      case "whatsapp":
        url = `https://api.whatsapp.com/send?text=${shareUrl}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${shareUrl}`;
        break;
      default:
        return;
    }

    window.open(url, "_blank", "noopener,noreferrer");

    // 🔹 Optional: Update share count in Firestore
    const blogRef = doc(db, "createPost-dk-news-blog", data?.blogID);
    await updateDoc(blogRef, {
      share: (data?.share || 0) + 1,
    });

    handleCloseSocial();
  };

  // const handleShare = (platform) => {
  //   let url = "";

  //   switch (platform) {
  //     case "facebook":
  //       url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
  //       break;
  //     case "twitter":
  //       url = `https://twitter.com/intent/tweet?url=${shareUrl}`;
  //       break;
  //     case "linkedin":
  //       url = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
  //       break;
  //     case "whatsapp":
  //       url = `https://api.whatsapp.com/send?text=${shareUrl}`;
  //       break;
  //     case "telegram":
  //       url = `https://t.me/share/url?url=${shareUrl}`;
  //       break;
  //     default:
  //       break;
  //   }

  //   window.open(url, "_blank");
  //   handleCloseSocial();
  // };
  //  const [anchorEl, setAnchorEl] = useState(null);
  // const open = Boolean(anchorEl);
  // useEffect(() => {
  //   onAuthStateChanged(auth, async (user) => {
  //     if (user) {
  //       setIsLoggedIn(true);
  //       const userRef = doc(db, "users-dk-news-blog", user.uid);
  //       const userSnap = await getDoc(userRef);

  //       if (userSnap.exists()) {
  //         setUserData(userSnap.data());
  //       } else {
  //         setUserData({
  //           displayName: user.displayName || "User",
  //           email: user.email,
  //         });
  //       }
  //     } else {
  //       setIsLoggedIn(false);
  //       setUserData(null);
  //     }
  //   });
  // }, []);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserUid(user.uid);
        setAlreadyLogin(true);
        setIsLoggedIn(true);

        // 🔹 Current logged-in user doc fetch karo
        const userDoc = await getDoc(doc(db, "users-dk-news-blog", user.uid));
        if (userDoc.exists()) {
          const userDataWithID = { ...userDoc.data(), userID: userDoc.id };
          setCurrentUserData(userDataWithID);

          // 🔹 Set isFavorite based on current user's favorites
          if (blogData?.blogID) {
            setIsFavorite(userDataWithID.favorites?.includes(blogData.blogID));
          }
        } else {
          setCurrentUserData(null);
          setIsFavorite(false);
        }
      } else {
        setCurrentUserUid(null);
        setAlreadyLogin(false);
        setIsLoggedIn(false);
        setCurrentUserData(null);
        setIsFavorite(false);
      }
    });

    return () => unsubscribe();
  }, [auth, db, blogData?.blogID]);

  const formatCount = (count, emoji) => {
    if (!count) return `0 ${emoji}`;
    if (count < 1000) return `${count} ${emoji}`;
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k ${emoji}`;
    if (count < 1000000000) return `${(count / 1000000).toFixed(1)}M ${emoji}`;
    return `${(count / 1000000000).toFixed(1)}B ${emoji}`;
  };

  const likeHandler = async () => {
    // setIsLiked(true);
    if (alreadyLogin) {
      let like = blogData?.like || [];
      let isLikedIn = like?.includes(currentUserUid);
      if (isLikedIn) {
        // remove
        for (let index in like) {
          if (like[index] === currentUserUid) {
            like.splice(index, 1);
            break;
          }
        }
      } else {
        // add
        like.push(currentUserUid);
      }
      // update data
      const blogRef = doc(db, "createPost-dk-news-blog", blogData?.blogID);
      await updateDoc(blogRef, { like: like });
    } else {
      setModelOpen(true);
      // alert("Please login to like posts.");
    }
  };

  const handleProfileClick = (event) => {
    setProfileAnchor(event.currentTarget);
  };
  const handleProfileClose = () => {
    setProfileAnchor(null);
  };

  // console.log("isFavourites", isFavourite);
  // useEffect(() => {
  //   const favs = JSON.parse(localStorage.getItem("favourites")) || [];
  //   if (data?.id && favs.includes(data.id)) {
  //     // setIsFavourite(true);
  //   }
  // }, [data?.id]);

  const handleFavoriteClick = async () => {
    // alert("Feature coming soon!");
    if (alreadyLogin) {
      let favorite = currentUserData?.favorites || [];
      let isFavoriteIn = favorite?.includes(data?.blogID);
      // console.log("isFavoriteIn", isFavoriteIn);
      if (isFavoriteIn) {
        // remove
        for (let index in favorite) {
          if (favorite[index] === data?.blogID) {
            favorite.splice(index, 1);
            setIsFavorite(false);
            break;
          }
        }
      } else {
        // add
        favorite.push(data?.blogID);
        setIsFavorite(true);
      }
      // update data
      const blogRef = doc(db, "users-dk-news-blog", currentUserUid);
      await updateDoc(blogRef, { favorites: favorite });
      // console.log("Updated favorites:", favorite);
    } else {
      setModelOpen(true);
      // alert("Please login to like posts.");
    }
  };

  // Comment handler
  const commentHandler = async () => {
    // alert("Feature coming soon!");
    if (alreadyLogin) {
      setLoadingComment(true);
      let userComment = Array.isArray(blogData?.comment)
        ? [...blogData.comment]
        : [];
      const newComment = {
        userID: currentUserUid,
        comment: comment,
        commentedAt: new Date().toISOString(),
        replyComments: [],
      };
      userComment.push(newComment);
      // update data
      const blogRef = doc(db, "createPost-dk-news-blog", blogData?.blogID);
      await updateDoc(blogRef, { comment: userComment })
        .then(() => {
          toast.success("Comment Added Successfully", {
            position: "top-right",
          });
          setShowCommentBox(false);
          setComment("");
          setLoadingComment(false);
        })
        .catch((error) => {
          console.error("Error adding comment: ", error);
          setLoadingComment(false);
          setComment("");
        });
      // clear comment box
    } else {
      setModelOpen(true);
    }
  };

  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Menu action handlers
  const handleEdit = () => {
    console.log("Edit Post");
    handleMenuClose();
  };

  const handleDelete = () => {
    console.log("Delete Post");
    handleMenuClose();
  };

  const handleCopyLink = async () => {
    try {
      const link = `${window.location.origin}/blog-details/${data?.blogID}`;
      await navigator.clipboard.writeText(link);

      setCopied(true);
      setTimeout(() => setCopied(false), 5000);
      handleMenuClose();
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  // const handleShare = () => {
  //   if (navigator.share) {
  //     navigator.share({
  //       title: data?.blogTitle,
  //       text: data?.blogDetails,
  //       url: window.location.href + "/post/" + data?.id,
  //     });
  //   } else {
  //     console.log("Share API not supported");
  //   }
  //   handleMenuClose();
  // };

  // const handleReport = () => {
  //   console.log("Report Post");
  //   handleMenuClose();
  // };

  // const handleFollow = () => {
  //   console.log("Follow / Unfollow Author");
  //   handleMenuClose();
  // };

  // const handleSave = () => {
  //   console.log("Save Post");
  //   handleMenuClose();
  // };

  // const handlePin = () => {
  //   console.log("Pin / Unpin Post");
  //   handleMenuClose();
  // };

  // const handleInsights = () => {
  //   console.log("View Insights");
  //   handleMenuClose();
  // };

  // const handleMute = () => {
  //   console.log("Mute Notifications");
  //   handleMenuClose();
  // };

  return (
    <Card
      variant="outlined"
      className="card-container"
      sx={{ position: "relative" }}

      // onClick={() => {
      //   navigate(`/blog-details/${blogData?.blogID}`, {
      //     state: {
      //       blogData: blogData,
      //       loading: loading,
      //       currentUserData: currentUserData,
      //     },
      //   });
      // }}
    >
      {/* Header */}
      <CardContent
        orientation="horizontal"
        sx={{ alignItems: "center", gap: 1 }}
      >
        <Box className="card-avatar">
          {loading ? (
            <Skeleton variant="circular" width={40} height={40} />
          ) : (
            <Avatar
              size="sm"
              src={data?.profileImageUrl}
              alt={data?.name || "User"}
              className="card-avatar-profile"
              onClick={handleProfileClick}
              sx={{ cursor: "pointer" }}
            />
          )}
        </Box>

        <Box className="card-info" sx={{ flexGrow: 1 }}>
          {loading ? (
            <>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </>
          ) : (
            <>
              <Typography
                className="card-title"
                sx={{ fontSize: "14px", margin: 0, cursor: "pointer" }}
                onClick={handleProfileClick} // 👈 click on username
              >
                <strong>{data?.name || "MUI"}</strong>
              </Typography>
              <Typography
                className="card-subtitle"
                sx={{ fontSize: "10px", color: "text.tertiary", margin: 0 }}
              >
                {moment(data?.createdAt).fromNow() || "2 days ago"}
              </Typography>
            </>
          )}
        </Box>

        {loading ? (
          <Skeleton variant="rectangular" width={25} height={10} />
        ) : (
          <>
            <IconButton
              variant="plain"
              color="neutral"
              size="sm"
              sx={{ ml: "auto" }}
              onClick={handleMenuClick}
            >
              <MoreHoriz />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              // FIX: prevent page width disturbance
              disableScrollLock={true}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              sx={{ zIndex: 1 }}
            >
              {/* Post Management */}
              {/* <MenuItem>👤 User Profile</MenuItem>
              <MenuItem onClick={handleFollow}>
                👤 Follow / Unfollow Author
              </MenuItem> */}
              {/* <MenuItem onClick={handleEdit}>✏️ Edit Post</MenuItem>
              <MenuItem onClick={handleDelete}>🗑️ Delete Post</MenuItem>
              <MenuItem onClick={handleCopyLink}>🔗 Copy Link</MenuItem> */}

              {/* ✅ Show Edit/Delete only on dashboard and if current user is author */}
              {/* ✅ Show Edit/Delete only if user is author AND route is dashboard */}
              {isAuthor && isDashboard ? (
                <>
                  <MenuItem onClick={() => setOpenEditPostModel(true)}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                    Edit Post
                  </MenuItem>

                  <MenuItem onClick={handleDelete}>
                    <DeleteIcon
                      fontSize="small"
                      sx={{ mr: 1, color: "error.main" }}
                    />
                    Delete Post
                  </MenuItem>
                </>
              ) : null}
              {/* ✅ Modal only appears when “Edit” clicked */}
              {openEditPostModel && (
                <EditPostModal
                  open={openEditPostModel}
                  handleClose={() => setOpenEditPostModel(false)}
                  data={data}
                />
              )}

              <MenuItem onClick={handleCopyLink}>
                <LinkIcon fontSize="small" sx={{ mr: 1 }} />
                {copied ? "Copied!" : "Copy Link"}
              </MenuItem>

              {/* <MenuItem onClick={handlePin}>📌 Pin / Unpin Post</MenuItem> */}
              {/* <Divider /> */}

              {/* User Engagement */}
              {/* <MenuItem onClick={handleShare}>📤 Share Post</MenuItem> */}
              {/* <MenuItem onClick={handleSave}>📑 Save Post</MenuItem> */}
              {/* <Divider /> */}

              {/* Content Actions */}
              {/* <MenuItem onClick={handleReport}>🚩 Report Post</MenuItem> */}
              {/* <MenuItem onClick={handleMute}>🔕 Mute Notifications</MenuItem> */}

              {/* <Divider /> */}

              {/* Advanced */}
              {/* <MenuItem onClick={handleInsights}>📊 View Insights</MenuItem> */}
            </Menu>
          </>
        )}
      </CardContent>

      {/* 👇 Popover for User Profile */}
      <Popover
        open={profileOpen}
        anchorEl={profileAnchor}
        onClose={handleProfileClose}
        disablePortal // ✅ prevent re-parenting outside card
        disableScrollLock // ✅ page scroll lock hatao
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            boxShadow: 3,
            borderRadius: 2,
            // width: "200px",
            // maxWidth: "90%",
            // overflow: "hidden",
          },
        }}
        sx={{ zIndex: 20 }}
      >
        <UserProfileCard data={data} className="user-profile-card" />
      </Popover>

      {/* Image */}
      <CardOverflow>
        <AspectRatio>
          {loading ? (
            <Skeleton
              sx={{ height: 200 }}
              animation="wave"
              variant="rectangular"
            />
          ) : (
            <div className="mediaImgVideo">
              {data?.fileType === "image" ? (
                <CardMedia
                  component="img"
                  width="100%"
                  height="100%"
                  image={data?.fileURL}
                  alt={data?.blogTitle || "Image"}
                />
              ) : data?.fileType === "video" ? (
                <video
                  width="100%"
                  height="100%"
                  controls
                  style={{ borderRadius: "8px", background: "black" }}
                >
                  <source src={data?.fileURL} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : null}
            </div>
          )}
        </AspectRatio>
      </CardOverflow>

      {/* Actions */}
      <CardContent
        orientation="horizontal"
        sx={{ alignItems: "center", mx: -1, mb: 0 }}
      >
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {loading ? (
            <>
              <Skeleton variant="rectangular" width={24} height={24} />
              <Skeleton variant="rectangular" width={24} height={24} />
              <Skeleton variant="rectangular" width={24} height={24} />
            </>
          ) : (
            <>
              <IconButton
                variant="plain"
                color="neutral"
                size="sm"
                onClick={likeHandler}
              >
                {isLiked ? (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 2 }}
                  >
                    <FavoriteIcon style={{ color: "green" }} />
                    <b>{formatCount(data?.like?.length || 0, "")}</b>
                  </div>
                ) : (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 2 }}
                  >
                    <FavoriteBorder />
                    <b>{formatCount(data?.like?.length || 0, "")}</b>
                  </div>
                )}
              </IconButton>
              <IconButton
                variant="plain"
                color="neutral"
                size="sm"
                onClick={() => setShowCommentBox((prev) => !prev)} // toggle
              >
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <ModeCommentOutlined />
                  <b>{formatCount(data?.comment?.length || 0, "")}</b>
                </div>
              </IconButton>

              <IconButton
                variant="plain"
                color="neutral"
                size="sm"
                onClick={handleOpenSocial}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <SendOutlined />
                  <b>{formatCount(data?.share?.length || 0, "")}</b>
                </div>
              </IconButton>

              <Menu
                anchorEl={anchorE2}
                open={Boolean(anchorE2)}
                onClose={handleCloseSocial}
                placement="bottom-end"
                disableScrollLock
                sx={{
                  p: 0.5,
                  borderRadius: "12px",
                  // boxShadow: "0px 4px 15px rgba(0,0,0,0.15)",
                  width: { xs: "90%", sm: "250px" },
                  maxWidth: "100%",
                  zIndex: 1,
                }}
              >
                <MenuItem onClick={() => handleShare("facebook")}>
                  <FacebookIcon sx={{ mr: 1, color: "#1877F2" }} />
                  Facebook
                </MenuItem>
                <MenuItem onClick={() => handleShare("whatsapp")}>
                  <WhatsappIcon sx={{ mr: 1, color: "#25D366" }} />
                  WhatsApp
                </MenuItem>
                <MenuItem onClick={() => handleShare("twitter")}>
                  <TwitterIcon sx={{ mr: 1, color: "#1DA1F2" }} />
                  Twitter
                </MenuItem>
                <MenuItem onClick={() => handleShare("linkedin")}>
                  <LinkedinIcon sx={{ mr: 1, color: "#0A66C2" }} />
                  LinkedIn
                </MenuItem>
                <MenuItem onClick={() => handleShare("telegram")}>
                  <TelegramIcon sx={{ mr: 1, color: "#0088cc" }} />
                  Telegram
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            mx: "auto",
          }}
        />
        {loading ? (
          <Skeleton
            variant="rectangular"
            width={20}
            height={25}
            sx={{ ml: "auto" }}
          />
        ) : (
          <Box
            sx={{
              width: 0,
              display: "flex",
              flexDirection: "row-reverse",
            }}
          >
            <IconButton
              variant="plain"
              color="neutral"
              size="sm"
              onClick={handleFavoriteClick}
            >
              {isFavorite ? (
                <BookmarkRoundedIcon />
              ) : (
                <BookmarkBorderRoundedIcon />
              )}
            </IconButton>
          </Box>
        )}
      </CardContent>

      {/* Content */}
      <CardContent sx={{ p: 0, m: 0 }}>
        {loading ? (
          <>
            <Skeleton variant="text" width="95%" />
            <Skeleton variant="text" width="95%" />
            <Skeleton variant="text" width="95%" />
            <Skeleton variant="text" width="95%" />
          </>
        ) : (
          <>
            <Link
              component="span"
              underline="none"
              textColor="text.primary"
              sx={{ fontSize: "sm", fontWeight: "lg", cursor: "default" }}
              className="LCS-link"
            >
              <div className="LCS-count">
                <FavoriteBorderIcon
                  sx={{
                    fontSize: 16,
                    verticalAlign: "middle",
                    color: "#e91e63",
                  }}
                />
                {formatCount(data?.like?.length || 0, "")}
              </div>

              <div className="LCS-count">
                <ChatBubbleOutlineIcon
                  sx={{
                    fontSize: 16,
                    verticalAlign: "middle",
                    color: "#2196f3",
                  }}
                />
                {formatCount(data?.comment?.length || 0, "")}
              </div>

              <div className="LCS-count">
                <ShareOutlinedIcon
                  sx={{
                    fontSize: 16,
                    verticalAlign: "middle",
                    color: "#4caf50",
                  }}
                />
                {formatCount(data?.share?.length || 0, "")}
              </div>
            </Link>

            <Typography
              sx={{ fontSize: "sm", textAlign: "justify", marginTop: 0 }}
              className="card-link-title"
            >
              {data?.blogTitle ||
                "The React component library you always wanted The React component library you always wanted"}
            </Typography>
            <Typography
              sx={{
                fontSize: "sm",
                color: "text.tertiary",
                textAlign: "justify",
              }}
              className="card-link-detail"
            >
              {data?.blogDetails ||
                "MUI is a simple and powerful component library for React. Build your own design system, or start with Material Design."}
            </Typography>
          </>
        )}
      </CardContent>

      {loading ? (
        <>
          <Skeleton variant="text" width="30%" />
        </>
      ) : (
        <CardContent sx={{ p: 0, m: 0 }}>
          <b
            onClick={() => {
              navigate(`/blog-details/${blogData?.blogID}`, {
                state: { edit: edit },
              });
            }}
            className="read-more-text"
          >
            Read more...
          </b>
        </CardContent>
      )}

      {/* Comment Box */}
      {showCommentBox && (
        <CardContent orientation="horizontal" sx={{ gap: 1, m: 0, p: 0 }}>
          {loading ? (
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}
            >
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton
                variant="rectangular"
                sx={{
                  flex: 1,
                  height: 32,
                  borderRadius: "8px",
                }}
              />
              <Skeleton
                variant="text"
                width={40}
                height={40}
                style={{ marginTop: "12px" }}
              />
            </Box>
          ) : (
            <>
              {isLoggedIn ? (
                currentUserData?.profileImageUrl ? (
                  <Avatar
                    size="sm"
                    src={currentUserData?.profileImageUrl}
                    alt={currentUserData?.name || "User"}
                    sx={{
                      border: "2px solid ",
                      borderColor: "rgba(253, 187, 45, 1)",
                    }}
                  />
                ) : (
                  <Avatar
                    size="sm"
                    sx={{
                      bgcolor: "primary.solidBg",
                      color: "white",
                    }}
                  >
                    {currentUserData?.name
                      ? currentUserData.name[0].toUpperCase()
                      : "U"}
                  </Avatar>
                )
              ) : (
                <IconButton
                  size="sm"
                  variant="plain"
                  color="neutral"
                  sx={{ ml: -1 }}
                >
                  <Face />
                </IconButton>
              )}

              <Input
                variant="plain"
                className="comment-input"
                size="sm"
                placeholder={
                  isLoggedIn ? "Add a comment…" : "Login to comment…"
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={!isLoggedIn}
                sx={{
                  flex: 1,
                  px: 1,
                  py: 0.5,
                  fontSize: "0.9rem",
                  borderRadius: "6px",
                  backgroundColor: "background.body",
                  border: "1px solid lightgray",

                  "&:hover": {
                    border: "1px solid lightgray",
                    backgroundColor: "background.body",
                  },

                  "&.Mui-focused": {
                    outline: "none !important",
                    border: "1px solid lightgray !important",
                    boxShadow: "none !important",
                    backgroundColor: "background.body",
                  },

                  "&.Mui-disabled": {
                    backgroundColor: "background.level2",
                    color: "text.tertiary",
                  },
                }}
              />

              <Link
                underline="none"
                role="button"
                disabled={!isLoggedIn || comment === ""}
                sx={{ cursor: isLoggedIn ? "pointer" : "not-allowed" }}
                className="post-link"
                onClick={commentHandler}
              >
                {loadingComment ? (
                  <CircularProgress style={{ color: "white" }} size={20} />
                ) : (
                  "Post"
                )}
              </Link>
            </>
          )}
        </CardContent>
      )}
      <BasicModal open={modelOpen} handleClose={() => setModelOpen(false)} />
    </Card>
  );
}
