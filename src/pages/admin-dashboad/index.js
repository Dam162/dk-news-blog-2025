import React, { useEffect, useMemo, useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./index.css";

import SearchIcon from "@mui/icons-material/Search";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PeopleIcon from "@mui/icons-material/People";
import ArticleIcon from "@mui/icons-material/Article";
import SecurityIcon from "@mui/icons-material/Security";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import VerifiedIcon from "@mui/icons-material/Verified";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import DownloadIcon from "@mui/icons-material/Download";
import CommentIcon from "@mui/icons-material/Comment";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BoltIcon from "@mui/icons-material/Bolt";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

const USER_ROLE = "USER";
const VERIFIED_ROLE = "VERIFIED_USER";
const ADMIN_ROLE = "ADMIN";
const USER_POST_LIMIT = 5;

const safeLength = (value) => (Array.isArray(value) ? value.length : 0);

const getDate = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue?.seconds) return new Date(dateValue.seconds * 1000);

  const parsedDate = new Date(dateValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const formatDate = (dateValue) => {
  const date = getDate(dateValue);
  return date ? date.toLocaleString() : "N/A";
};

const getNormalizedRole = (user = {}) => {
  const rawRole = user.role?.toUpperCase();

  if (rawRole === ADMIN_ROLE) return ADMIN_ROLE;
  if (
    rawRole === VERIFIED_ROLE ||
    user.isVerified ||
    user.verificationStatus === "APPROVED"
  ) {
    return VERIFIED_ROLE;
  }

  return USER_ROLE;
};

const getVerificationStatus = (user = {}) => {
  if (
    user.verificationStatus === "APPROVED" ||
    user.isVerified ||
    getNormalizedRole(user) === VERIFIED_ROLE
  ) {
    return "APPROVED";
  }

  if (user.verificationStatus === "REJECTED") return "REJECTED";
  if (user.verificationStatus === "PENDING" || user.appliedForVerified) {
    return "PENDING";
  }

  return "NONE";
};

const getPostLimit = (role) => {
  if (role === ADMIN_ROLE || role === VERIFIED_ROLE) return Infinity;
  return USER_POST_LIMIT;
};

const formatPostLimit = (limit) => {
  if (limit === Infinity) return "Unlimited";
  return `${limit} Posts`;
};

const matchesDateFilter = (dateValue, filter) => {
  if (filter === "all") return true;

  const date = getDate(dateValue);
  if (!date) return false;

  const now = new Date();

  if (filter === "today") {
    return date.toDateString() === now.toDateString();
  }

  if (filter === "week") {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    return date >= sevenDaysAgo;
  }

  if (filter === "month") {
    return (
      date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    );
  }

  if (filter === "year") {
    return date.getFullYear() === now.getFullYear();
  }

  return true;
};

const downloadCsv = (rows, fileName) => {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((key) => {
          const value = row[key] ?? "";
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.setAttribute("download", fileName);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [openSection, setOpenSection] = useState("overview");
  const [users, setUsers] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [showProfileBox, setShowProfileBox] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [graphType, setGraphType] = useState("weekly");
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("admin-theme") === "dark",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [blogSort, setBlogSort] = useState("newest");
  const [blogEngagementFilter, setBlogEngagementFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [processingUserId, setProcessingUserId] = useState(null);
  const [actionNotifications, setActionNotifications] = useState([]);
  const [seenNotificationIds, setSeenNotificationIds] = useState([]);

  useEffect(() => {
    localStorage.setItem("admin-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const usersSnapshot = await getDocs(collection(db, "users-dk-news-blog"));
        const usersList = usersSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        const blogsSnapshot = await getDocs(collection(db, "createPost-dk-news-blog"));
        const blogsList = blogsSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        setUsers(usersList);
        setBlogs(blogsList);

        const currentUser = auth.currentUser;

        if (currentUser) {
          const matchedUser = usersList.find(
            (user) =>
              user.uid === currentUser.uid || user.email === currentUser.email,
          );

          setCurrentUserData(matchedUser || null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [auth, db]);

  const userMap = useMemo(() => {
    const map = new Map();

    users.forEach((user) => {
      if (user?.id) map.set(user.id, user);
      if (user?.uid) map.set(user.uid, user);
    });

    return map;
  }, [users]);

  const postCountByUser = useMemo(() => {
    const map = new Map();

    blogs.forEach((blog) => {
      if (!blog?.userID) return;
      map.set(blog.userID, (map.get(blog.userID) || 0) + 1);
    });

    return map;
  }, [blogs]);

  const getPostsCountForUser = (user) => {
    if (!user) return 0;
    return postCountByUser.get(user.id) || postCountByUser.get(user.uid) || 0;
  };

  const normalizedUsers = useMemo(
    () =>
      users.map((user) => ({
        ...user,
        normalizedRole: getNormalizedRole(user),
        verificationState: getVerificationStatus(user),
      })),
    [users],
  );

  const admins = useMemo(
    () => normalizedUsers.filter((user) => user.normalizedRole === ADMIN_ROLE),
    [normalizedUsers],
  );

  const verifiedUsers = useMemo(
    () => normalizedUsers.filter((user) => user.normalizedRole === VERIFIED_ROLE),
    [normalizedUsers],
  );

  const standardUsers = useMemo(
    () => normalizedUsers.filter((user) => user.normalizedRole === USER_ROLE),
    [normalizedUsers],
  );

  const authors = useMemo(
    () => normalizedUsers.filter((user) => getPostsCountForUser(user) > 0),
    [normalizedUsers, postCountByUser],
  );

  const pendingVerificationUsers = useMemo(
    () =>
      normalizedUsers.filter(
        (user) => getVerificationStatus(user) === "PENDING",
      ),
    [normalizedUsers],
  );

  const recentJoinedUsers = useMemo(() => {
    return [...normalizedUsers]
      .filter((user) =>
        getDate(
          user.createdAt ||
            user.joinedAt ||
            user.created_at ||
            user.dateJoined ||
            user.updatedAt,
        ),
      )
      .sort((a, b) => {
        const dateA = getDate(
          a.createdAt || a.joinedAt || a.created_at || a.dateJoined || a.updatedAt,
        );
        const dateB = getDate(
          b.createdAt || b.joinedAt || b.created_at || b.dateJoined || b.updatedAt,
        );
        return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
      })
      .slice(0, 6);
  }, [normalizedUsers]);

  const newUsersThisMonth = useMemo(() => {
    const now = new Date();

    return normalizedUsers.filter((user) => {
      const date = getDate(
        user.createdAt ||
          user.joinedAt ||
          user.created_at ||
          user.dateJoined ||
          user.updatedAt,
      );

      return (
        date &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [normalizedUsers]);

  const thisWeekPosts = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return blogs.filter((blog) => {
      const date = getDate(blog.createdAt);
      return date && date >= sevenDaysAgo;
    }).length;
  }, [blogs]);

  const thisMonthPosts = useMemo(() => {
    const now = new Date();

    return blogs.filter((blog) => {
      const date = getDate(blog.createdAt);
      return (
        date &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [blogs]);

  const mostLikedPost = useMemo(() => {
    if (!blogs.length) return null;

    return blogs.reduce((top, blog) => {
      return safeLength(blog.like) > safeLength(top?.like) ? blog : top;
    }, blogs[0]);
  }, [blogs]);

  const mostSharedPost = useMemo(() => {
    if (!blogs.length) return null;

    return blogs.reduce((top, blog) => {
      return safeLength(blog.share) > safeLength(top?.share) ? blog : top;
    }, blogs[0]);
  }, [blogs]);

  const mostCommentedPost = useMemo(() => {
    if (!blogs.length) return null;

    return blogs.reduce((top, blog) => {
      return safeLength(blog.comment) > safeLength(top?.comment) ? blog : top;
    }, blogs[0]);
  }, [blogs]);

  const zeroLikesPosts = useMemo(
    () => blogs.filter((blog) => safeLength(blog.like) === 0).slice(0, 5),
    [blogs],
  );

  const zeroSharesPosts = useMemo(
    () => blogs.filter((blog) => safeLength(blog.share) === 0).slice(0, 5),
    [blogs],
  );

  const recentPosts = useMemo(() => {
    return [...blogs]
      .sort(
        (a, b) =>
          (getDate(b.createdAt)?.getTime() || 0) -
          (getDate(a.createdAt)?.getTime() || 0),
      )
      .slice(0, 6);
  }, [blogs]);

  const topCreators = useMemo(() => {
    return [...authors]
      .map((user) => ({
        ...user,
        postCount: getPostsCountForUser(user),
      }))
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 5);
  }, [authors, postCountByUser]);

  const maleCount = normalizedUsers.filter(
    (user) => user.gender?.toLowerCase() === "male",
  ).length;

  const femaleCount = normalizedUsers.filter(
    (user) => user.gender?.toLowerCase() === "female",
  ).length;

  const totalUsers = maleCount + femaleCount;

  const genderData = [
    { name: "Male", value: maleCount },
    { name: "Female", value: femaleCount },
  ];

  const COLORS = ["#3b82f6", "#ef4444"];

  const malePercent = totalUsers
    ? ((maleCount / totalUsers) * 100).toFixed(1)
    : 0;

  const femalePercent = totalUsers
    ? ((femaleCount / totalUsers) * 100).toFixed(1)
    : 0;

  const roleStats = [
    {
      key: ADMIN_ROLE,
      label: "ADMIN",
      count: admins.length,
      description: "Full access + unlimited posts",
      tone: "danger",
    },
    {
      key: USER_ROLE,
      label: "USER",
      count: standardUsers.length,
      description: `Can post only ${USER_POST_LIMIT} posts`,
      tone: "primary",
    },
    {
      key: VERIFIED_ROLE,
      label: "VERIFIED USER",
      count: verifiedUsers.length,
      description: "Unlimited posts + verified badge",
      tone: "success",
    },
  ];

  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    currentDate.setDate(currentDate.getDate() - (6 - i));

    return {
      label: currentDate.toLocaleDateString("default", {
        weekday: "short",
      }),
      posts: blogs.filter((blog) => {
        const blogDate = getDate(blog.createdAt);
        return blogDate && blogDate.toDateString() === currentDate.toDateString();
      }).length,
    };
  });

  const weeklyData = Array.from({ length: 5 }, (_, i) => ({
    label: `Week ${i + 1}`,
    posts: blogs.filter((blog) => {
      const blogDate = getDate(blog.createdAt);
      return blogDate && Math.ceil(blogDate.getDate() / 7) === i + 1;
    }).length,
  }));

  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    label: new Date(0, i).toLocaleString("default", {
      month: "short",
    }),
    posts: blogs.filter((blog) => {
      const blogDate = getDate(blog.createdAt);
      return blogDate && blogDate.getMonth() === i;
    }).length,
  }));

  const yearlyData = useMemo(() => {
    const groupedYears = {};

    blogs.forEach((blog) => {
      const blogDate = getDate(blog.createdAt);
      if (!blogDate) return;

      const year = blogDate.getFullYear();
      groupedYears[year] = (groupedYears[year] || 0) + 1;
    });

    return Object.keys(groupedYears)
      .map((year) => ({
        label: year,
        posts: groupedYears[year],
      }))
      .sort((a, b) => Number(a.label) - Number(b.label));
  }, [blogs]);

  const graphData =
    graphType === "daily"
      ? dailyData
      : graphType === "weekly"
        ? weeklyData
        : graphType === "monthly"
          ? monthlyData
          : yearlyData;

  const axisColor = darkMode ? "#cbd5e1" : "#64748b";
  const tooltipBg = darkMode ? "#0f172a" : "#ffffff";
  const tooltipBorder = darkMode ? "#334155" : "#e2e8f0";

  const generatedNotifications = useMemo(() => {
    const items = [];

    pendingVerificationUsers.forEach((user) => {
      items.push({
        id: `verification-${user.id}`,
        title: "Verification Request",
        message: `${user.name || "A user"} applied for verified status.`,
        createdAt:
          getDate(
            user.verificationRequestedAt ||
              user.updatedAt ||
              user.createdAt ||
              user.joinedAt,
          ) || new Date(),
        type: "warning",
        targetSection: "verification",
        targetUserId: user.id,
      });
    });

    recentJoinedUsers.forEach((user) => {
      items.push({
        id: `joined-${user.id}`,
        title: "New User Joined",
        message: `${user.name || "A user"} joined the platform.`,
        createdAt:
          getDate(
            user.createdAt ||
              user.joinedAt ||
              user.created_at ||
              user.dateJoined ||
              user.updatedAt,
          ) || new Date(),
        type: "info",
        targetSection: "users",
        targetUserId: user.id,
      });
    });

    recentPosts.slice(0, 4).forEach((blog) => {
      items.push({
        id: `blog-${blog.id}`,
        title: "New Post Added",
        message: `${blog.blogTitle || "Untitled post"} was published.`,
        createdAt: getDate(blog.createdAt) || new Date(),
        type: "success",
        targetSection: "blogs",
        targetBlogId: blog.id,
      });
    });

    return items.sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0),
    );
  }, [pendingVerificationUsers, recentJoinedUsers, recentPosts]);

  const allNotifications = useMemo(() => {
    return [...actionNotifications, ...generatedNotifications].sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0),
    );
  }, [actionNotifications, generatedNotifications]);

  useEffect(() => {
    if (showNotifications) {
      setSeenNotificationIds(allNotifications.map((item) => item.id));
    }
  }, [showNotifications, allNotifications]);

  const unreadNotificationCount = useMemo(
    () =>
      allNotifications.filter((item) => !seenNotificationIds.includes(item.id))
        .length,
    [allNotifications, seenNotificationIds],
  );

  const searchValue = searchTerm.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    return [...normalizedUsers]
      .filter((user) => {
        const role = getNormalizedRole(user);

        const matchesSearch =
          !searchValue ||
          [
            user.name,
            user.email,
            user.role,
            user.gender,
            user.skill,
            user.phone,
            user.verificationStatus,
            role,
          ].some((field) =>
            field?.toString().toLowerCase().includes(searchValue),
          );

        const matchesRole =
          roleFilter === "all" ? true : role === roleFilter;

        const matchesDate = matchesDateFilter(
          user.createdAt ||
            user.joinedAt ||
            user.created_at ||
            user.dateJoined ||
            user.updatedAt,
          dateFilter,
        );

        return matchesSearch && matchesRole && matchesDate;
      })
      .sort(
        (a, b) =>
          (getDate(
            b.createdAt || b.joinedAt || b.created_at || b.dateJoined || b.updatedAt,
          )?.getTime() || 0) -
          (getDate(
            a.createdAt || a.joinedAt || a.created_at || a.dateJoined || a.updatedAt,
          )?.getTime() || 0),
      );
  }, [normalizedUsers, searchValue, roleFilter, dateFilter]);

  const filteredAdmins = useMemo(
    () => filteredUsers.filter((user) => getNormalizedRole(user) === ADMIN_ROLE),
    [filteredUsers],
  );

  const filteredAuthors = useMemo(
    () => filteredUsers.filter((user) => getPostsCountForUser(user) > 0),
    [filteredUsers, postCountByUser],
  );

  const filteredVerificationUsers = useMemo(
    () => pendingVerificationUsers.filter((user) => {
      const matchesSearch =
        !searchValue ||
        [user.name, user.email, user.phone, user.skill].some((field) =>
          field?.toString().toLowerCase().includes(searchValue),
        );

      const matchesDate = matchesDateFilter(
        user.verificationRequestedAt ||
          user.updatedAt ||
          user.createdAt ||
          user.joinedAt,
        dateFilter,
      );

      return matchesSearch && matchesDate;
    }),
    [pendingVerificationUsers, searchValue, dateFilter],
  );

  const filteredBlogs = useMemo(() => {
    const list = blogs
      .filter((blog) => {
        const author = userMap.get(blog.userID);

        const matchesSearch =
          !searchValue ||
          [
            blog.blogTitle,
            blog.blogDetails,
            author?.name,
            author?.email,
            blog.blogID,
          ].some((field) =>
            field?.toString().toLowerCase().includes(searchValue),
          );

        const matchesDate = matchesDateFilter(blog.createdAt, dateFilter);

        const matchesEngagement =
          blogEngagementFilter === "all"
            ? true
            : blogEngagementFilter === "zeroLikes"
              ? safeLength(blog.like) === 0
              : blogEngagementFilter === "zeroShares"
                ? safeLength(blog.share) === 0
                : blogEngagementFilter === "zeroComments"
                  ? safeLength(blog.comment) === 0
                  : true;

        return matchesSearch && matchesDate && matchesEngagement;
      })
      .sort((a, b) => {
        if (blogSort === "oldest") {
          return (
            (getDate(a.createdAt)?.getTime() || 0) -
            (getDate(b.createdAt)?.getTime() || 0)
          );
        }

        if (blogSort === "likes") {
          return safeLength(b.like) - safeLength(a.like);
        }

        if (blogSort === "shares") {
          return safeLength(b.share) - safeLength(a.share);
        }

        if (blogSort === "comments") {
          return safeLength(b.comment) - safeLength(a.comment);
        }

        return (
          (getDate(b.createdAt)?.getTime() || 0) -
          (getDate(a.createdAt)?.getTime() || 0)
        );
      });

    return list;
  }, [blogs, userMap, searchValue, dateFilter, blogSort, blogEngagementFilter]);

  const handleBlogClick = (blog) => {
    setSelectedBlog((prev) => (prev?.id === blog.id ? null : blog));
    setSelectedUser(null);
  };

  const handleUserClick = (user) => {
    setSelectedUser((prev) => (prev?.id === user.id ? null : user));
    setSelectedBlog(null);
  };

  const openHighlightedPost = (post) => {
    if (!post) return;
    setOpenSection("blogs");
    setSelectedUser(null);
    setSelectedBlog(post);
    setSidebarVisible(false);
  };

  const handleCreatorClick = (creator) => {
    setOpenSection("users");
    setSelectedBlog(null);
    setSelectedUser(creator);
    setSidebarVisible(false);
  };

  const handleNotificationClick = (item) => {
    if (item.targetSection) setOpenSection(item.targetSection);

    if (item.targetUserId) {
      const foundUser = normalizedUsers.find((user) => user.id === item.targetUserId);
      setSelectedUser(foundUser || null);
      setSelectedBlog(null);
    }

    if (item.targetBlogId) {
      const foundBlog = blogs.find((blog) => blog.id === item.targetBlogId);
      setSelectedBlog(foundBlog || null);
      setSelectedUser(null);
    }

    setShowNotifications(false);
    setSidebarVisible(false);
  };

  const handleSectionChange = (section) => {
    setOpenSection(section);
    setSelectedBlog(null);
    setSelectedUser(null);
    setSidebarVisible(false);
  };

  const handleOpenUsersByRole = (role) => {
    setRoleFilter(role);
    setOpenSection("users");
    setSelectedBlog(null);
    setSelectedUser(null);
    setSidebarVisible(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleVerificationAction = async (user, action) => {
    try {
      setProcessingUserId(user.id);

      const payload =
        action === "accept"
          ? {
              role: VERIFIED_ROLE,
              isVerified: true,
              appliedForVerified: true,
              verificationStatus: "APPROVED",
              verificationReviewedAt: new Date(),
            }
          : {
              role: USER_ROLE,
              isVerified: false,
              appliedForVerified: false,
              verificationStatus: "REJECTED",
              verificationReviewedAt: new Date(),
            };

      await updateDoc(doc(db, "users-dk-news-blog", user.id), payload);

      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id
            ? {
                ...item,
                ...payload,
              }
            : item,
        ),
      );

      setActionNotifications((prev) => [
        {
          id: `action-${action}-${user.id}-${Date.now()}`,
          title:
            action === "accept"
              ? "Verification Approved"
              : "Verification Rejected",
          message:
            action === "accept"
              ? `${user.name || "User"} is now a verified user.`
              : `${user.name || "User"} verification request was rejected.`,
          createdAt: new Date(),
          type: action === "accept" ? "success" : "danger",
          targetSection: "verification",
          targetUserId: user.id,
        },
        ...prev,
      ]);
    } catch (error) {
      console.error("Verification action error:", error);
    } finally {
      setProcessingUserId(null);
    }
  };

  const exportUsersCsv = () => {
    const rows = filteredUsers.map((user) => {
      const role = getNormalizedRole(user);
      const postCount = getPostsCountForUser(user);
      const limit = getPostLimit(role);

      return {
        Name: user.name || "",
        Email: user.email || "",
        Role: role,
        VerificationStatus: getVerificationStatus(user),
        Phone: user.phone || "",
        Gender: user.gender || "",
        Skill: user.skill || "",
        TotalPosts: postCount,
        PostLimit: limit === Infinity ? "Unlimited" : limit,
        JoinedAt: formatDate(
          user.createdAt ||
            user.joinedAt ||
            user.created_at ||
            user.dateJoined ||
            user.updatedAt,
        ),
      };
    });

    downloadCsv(rows, "users-report.csv");
  };

  const exportBlogsCsv = () => {
    const rows = filteredBlogs.map((blog) => ({
      Title: blog.blogTitle || "",
      Author: userMap.get(blog.userID)?.name || "Unknown",
      Email: userMap.get(blog.userID)?.email || "",
      Likes: safeLength(blog.like),
      Shares: safeLength(blog.share),
      Comments: safeLength(blog.comment),
      CreatedAt: formatDate(blog.createdAt),
      BlogID: blog.blogID || "",
      UserID: blog.userID || "",
    }));

    downloadCsv(rows, "blogs-report.csv");
  };

  const searchPlaceholder =
    openSection === "blogs"
      ? "Search blog posts..."
      : openSection === "admins"
        ? "Search admins..."
        : openSection === "authors"
          ? "Search authors..."
          : openSection === "verification"
            ? "Search verification requests..."
            : "Search users, emails, roles...";

  const renderUserList = ({
    title,
    titleClass = "",
    badgeClass = "",
    usersList = [],
    emptyText = "No users found.",
    allowVerificationActions = false,
  }) => (
    <div className="users-list-container">
      <div className="section-head">
        <h2 className={`users-list-heading ${titleClass}`}>{title}</h2>
        <span className={`section-badge ${badgeClass}`}>{usersList.length}</span>
      </div>

      {usersList.length > 0 ? (
        usersList.map((user, index) => {
          const role = getNormalizedRole(user);
          const verificationState = getVerificationStatus(user);
          const postCount = getPostsCountForUser(user);
          const postLimit = getPostLimit(role);
          const remainingPosts =
            postLimit === Infinity ? "Unlimited" : Math.max(postLimit - postCount, 0);

          return (
            <div key={user.id} className="user-card">
              <div className={`user-number ${badgeClass.replace("badge", "number")}`}>
                {index + 1}
              </div>

              <div className="card-content">
                <div className="user-basic-row">
                  <div className="user-basic" onClick={() => handleUserClick(user)}>
                    <img
                      src={user.profileImageUrl || "https://via.placeholder.com/60"}
                      alt="user"
                      className="user-img"
                    />

                    <div className="user-text">
                      <h4>{user.name || "No Name"}</h4>
                      <p>{user.email || "No Email"}</p>
                    </div>
                  </div>

                  <div className="meta-badges">
                    <span className={`role-chip role-${role.toLowerCase()}`}>
                      {role === VERIFIED_ROLE ? "VERIFIED USER" : role}
                    </span>

                    <span className={`status-chip status-${verificationState.toLowerCase()}`}>
                      {verificationState}
                    </span>
                  </div>
                </div>

                {selectedUser?.id === user.id && (
                  <div className="user-details">
                    <p>
                      <strong>Email:</strong> {user.email || "N/A"}
                    </p>
                    <p>
                      <strong>Father's Name:</strong> {user.fatherName || "N/A"}
                    </p>
                    <p>
                      <strong>Gender:</strong> {user.gender || "N/A"}
                    </p>
                    <p>
                      <strong>Date of Birth:</strong> {user.dob || "N/A"}
                    </p>
                    <p>
                      <strong>Phone:</strong> {user.phone || "N/A"}
                    </p>
                    <p>
                      <strong>Skill:</strong> {user.skill || "N/A"}
                    </p>
                    <p>
                      <strong>Favorite Posts:</strong> {safeLength(user.favorites)}
                    </p>
                    <p>
                      <strong>Age:</strong> {user.age || "N/A"}
                    </p>
                    <p>
                      <strong>Followers:</strong> {safeLength(user.followers)}
                    </p>
                    <p>
                      <strong>Total Posts:</strong> {postCount}
                    </p>
                    <p>
                      <strong>Post Limit:</strong> {formatPostLimit(postLimit)}
                    </p>
                    <p>
                      <strong>Remaining Posts:</strong> {remainingPosts}
                    </p>
                    <p>
                      <strong>Verified User:</strong>{" "}
                      {verificationState === "APPROVED" ? "Yes" : "No"}
                    </p>
                    <p>
                      <strong>Verification Request:</strong> {verificationState}
                    </p>
                    <p>
                      <strong>Joined At:</strong>{" "}
                      {formatDate(
                        user.createdAt ||
                          user.joinedAt ||
                          user.created_at ||
                          user.dateJoined ||
                          user.updatedAt,
                      )}
                    </p>
                    <p>
                      <strong>Role:</strong>{" "}
                      {role === VERIFIED_ROLE ? "VERIFIED USER" : role}
                    </p>
                  </div>
                )}

                {allowVerificationActions && verificationState === "PENDING" && (
                  <div className="action-row">
                    <button
                      type="button"
                      className="action-btn approve-btn"
                      disabled={processingUserId === user.id}
                      onClick={() => handleVerificationAction(user, "accept")}
                    >
                      <CheckCircleIcon />
                      Accept
                    </button>

                    <button
                      type="button"
                      className="action-btn reject-btn"
                      disabled={processingUserId === user.id}
                      onClick={() => handleVerificationAction(user, "reject")}
                    >
                      <CancelIcon />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="section-empty">{emptyText}</div>
      )}
    </div>
  );

  const renderBlogList = () => (
    <div className="users-list-container">
      <div className="section-head">
        <h2 className="users-list-heading blogs-list-heading">Blog Posts</h2>
        <span className="section-badge blog-badge">{filteredBlogs.length}</span>
      </div>

      {filteredBlogs.length > 0 ? (
        filteredBlogs.map((blog, index) => {
          const author = userMap.get(blog.userID);

          return (
            <div key={blog.id} className="user-card">
              <div className="user-number blog-number">{index + 1}</div>

              <div className="card-content">
                <div className="user-basic-row">
                  <div className="user-basic" onClick={() => handleBlogClick(blog)}>
                    <div className="user-text">
                      <h4>{blog.blogTitle || "No Title"}</h4>
                      <p>{author?.name || "Unknown Author"}</p>
                    </div>
                  </div>

                  <div className="meta-badges">
                    <span className="engagement-chip like-chip">
                      {safeLength(blog.like)} Likes
                    </span>
                    <span className="engagement-chip share-chip">
                      {safeLength(blog.share)} Shares
                    </span>
                    <span className="engagement-chip comment-chip">
                      {safeLength(blog.comment)} Comments
                    </span>
                  </div>
                </div>

                {selectedBlog?.id === blog.id && (
                  <div className="user-details">
                    <p>
                      <strong>Detail:</strong> {blog.blogDetails || "N/A"}
                    </p>
                    <p>
                      <strong>Created At:</strong> {formatDate(blog.createdAt)}
                    </p>
                    <p>
                      <strong>Blog ID:</strong> {blog.blogID || "N/A"}
                    </p>
                    <p>
                      <strong>Comments:</strong> {safeLength(blog.comment)}
                    </p>
                    <p>
                      <strong>Likes:</strong> {safeLength(blog.like)}
                    </p>
                    <p>
                      <strong>Shares:</strong> {safeLength(blog.share)}
                    </p>
                    <p>
                      <strong>File ID:</strong> {blog.fileID || "N/A"}
                    </p>
                    <p>
                      <strong>User ID:</strong> {blog.userID || "N/A"}
                    </p>
                    <p>
                      <strong>Author:</strong> {author?.name || "Unknown"}
                    </p>
                    <p>
                      <strong>Author Email:</strong> {author?.email || "N/A"}
                    </p>
                    <p>
                      <strong>Author Role:</strong>{" "}
                      {author ? getNormalizedRole(author) : "N/A"}
                    </p>
                    <p>
                      <strong>File URL:</strong>{" "}
                      {blog.fileURL ? (
                        <a
                          href={blog.fileURL}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-link"
                        >
                          Open File
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="section-empty">No blog posts found.</div>
      )}
    </div>
  );

  return (
    <div className={`admin-dashboard ${darkMode ? "dark" : ""}`}>
      {sidebarVisible && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarVisible(false)}
        />
      )}

      <aside className={`sidebar ${sidebarVisible ? "visible" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-badge">A</div>
          <div>
            <h2>Admin Panel</h2>
            <p>Dashboard overview</p>
          </div>
        </div>

        <div className="sidebar-items">
          <button
            type="button"
            className={`sidebar-item ${openSection === "overview" ? "active" : ""}`}
            onClick={() => handleSectionChange("overview")}
          >
            Overview
          </button>

          <button
            type="button"
            className={`sidebar-item ${openSection === "blogs" ? "active" : ""}`}
            onClick={() => handleSectionChange("blogs")}
          >
            Blogs
          </button>

          <button
            type="button"
            className={`sidebar-item ${openSection === "users" ? "active" : ""}`}
            onClick={() => handleSectionChange("users")}
          >
            Users
          </button>

          <button
            type="button"
            className={`sidebar-item ${openSection === "verification" ? "active" : ""}`}
            onClick={() => handleSectionChange("verification")}
          >
            Verification Requests
          </button>

          <button
            type="button"
            className={`sidebar-item ${openSection === "admins" ? "active" : ""}`}
            onClick={() => handleSectionChange("admins")}
          >
            Admins
          </button>

          <button
            type="button"
            className={`sidebar-item ${openSection === "authors" ? "active" : ""}`}
            onClick={() => handleSectionChange("authors")}
          >
            Authors
          </button>

          <button
            type="button"
            className="sidebar-item logout-item"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="dashboard-header">
          <div className="left-section">
            <button
              type="button"
              className="hamburger-menu"
              onClick={() => setSidebarVisible((prev) => !prev)}
            >
              {sidebarVisible ? (
                <CloseIcon className="hamburger-menu-icon" />
              ) : (
                <MenuIcon className="hamburger-menu-icon" />
              )}
            </button>

            <div className="search-box">
              <SearchIcon className="search-icon-admin" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="header-actions">
            <div className="notification-wrap">
              <button
                type="button"
                className="theme-toggle"
                onClick={() => {
                  setShowNotifications((prev) => !prev);
                  setShowProfileBox(false);
                }}
                aria-label="Notifications"
              >
                <NotificationsNoneIcon className="theme-icon" />
                {unreadNotificationCount > 0 && (
                  <span className="notification-badge">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              <div
                className={`notification-dropdown ${
                  showNotifications ? "show" : ""
                }`}
              >
                <div className="dropdown-head">
                  <h4>Notifications</h4>
                  <span>{allNotifications.length}</span>
                </div>

                {allNotifications.length > 0 ? (
                  allNotifications.slice(0, 10).map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={`notification-item ${item.type}`}
                      onClick={() => handleNotificationClick(item)}
                    >
                      <div className="notification-title-row">
                        <strong>{item.title}</strong>
                        <small>{formatDate(item.createdAt)}</small>
                      </div>
                      <p>{item.message}</p>
                    </button>
                  ))
                ) : (
                  <div className="section-empty">No notifications yet.</div>
                )}
              </div>
            </div>

            <button
              type="button"
              className="theme-toggle"
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <LightModeIcon className="theme-icon" />
              ) : (
                <DarkModeIcon className="theme-icon" />
              )}
            </button>

            <div
              className="profile-toggle"
              onClick={() => {
                setShowProfileBox((prev) => !prev);
                setShowNotifications(false);
              }}
            >
              {currentUserData?.profileImageUrl ? (
                <img
                  src={currentUserData.profileImageUrl}
                  alt="profile"
                  className="profile-img"
                />
              ) : (
                <AccountCircleIcon className="profile-fallback" />
              )}

              <div className={`profile-dropdown ${showProfileBox ? "show" : ""}`}>
                <p className="profile-name">{currentUserData?.name || "Admin User"}</p>
                <p>{currentUserData?.email || "No email available"}</p>
                <span className="profile-role">
                  {getNormalizedRole(currentUserData || {}) === VERIFIED_ROLE
                    ? "VERIFIED USER"
                    : getNormalizedRole(currentUserData || {})}
                </span>
              </div>
            </div>
          </div>
        </header>

        <section className="summary-row">
          <div className="summary-box user-summary" onClick={() => handleOpenUsersByRole("all")}>
            <div className="summary-icon-wrap">
              <PeopleIcon className="iconAdmin" />
            </div>
            <div>
              <p className="summary-label">Total Users</p>
              <h3>{normalizedUsers.length}</h3>
            </div>
          </div>

          <div className="summary-box blog-summary" onClick={() => handleSectionChange("blogs")}>
            <div className="summary-icon-wrap">
              <ArticleIcon className="iconAdmin" />
            </div>
            <div>
              <p className="summary-label">Blog Posts</p>
              <h3>{blogs.length}</h3>
            </div>
          </div>

          <div className="summary-box admin-summary" onClick={() => handleOpenUsersByRole(ADMIN_ROLE)}>
            <div className="summary-icon-wrap">
              <SecurityIcon className="iconAdmin" />
            </div>
            <div>
              <p className="summary-label">Admins</p>
              <h3>{admins.length}</h3>
            </div>
          </div>

          <div className="summary-box verified-summary" onClick={() => handleOpenUsersByRole(VERIFIED_ROLE)}>
            <div className="summary-icon-wrap">
              <VerifiedIcon className="iconAdmin" />
            </div>
            <div>
              <p className="summary-label">Verified Users</p>
              <h3>{verifiedUsers.length}</h3>
            </div>
          </div>

          <div className="summary-box pending-summary" onClick={() => handleSectionChange("verification")}>
            <div className="summary-icon-wrap">
              <AccessTimeIcon className="iconAdmin" />
            </div>
            <div>
              <p className="summary-label">Pending Requests</p>
              <h3>{pendingVerificationUsers.length}</h3>
            </div>
          </div>

          <div className="summary-box growth-summary" onClick={() => handleSectionChange("overview")}>
            <div className="summary-icon-wrap">
              <BoltIcon className="iconAdmin" />
            </div>
            <div>
              <p className="summary-label">New Users This Month</p>
              <h3>{newUsersThisMonth}</h3>
            </div>
          </div>
        </section>

        <section className="toolbar-card">
          <div className="toolbar-grid">
            <div className="toolbar-control">
              <label>Date Filter</label>
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            <div className="toolbar-control">
              <label>User Role</label>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">All Roles</option>
                <option value={ADMIN_ROLE}>ADMIN</option>
                <option value={USER_ROLE}>USER</option>
                <option value={VERIFIED_ROLE}>VERIFIED USER</option>
              </select>
            </div>

            <div className="toolbar-control">
              <label>Blog Sort</label>
              <select value={blogSort} onChange={(e) => setBlogSort(e.target.value)}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="likes">Most Liked</option>
                <option value="shares">Most Shared</option>
                <option value="comments">Most Commented</option>
              </select>
            </div>

            <div className="toolbar-control">
              <label>Blog Filter</label>
              <select
                value={blogEngagementFilter}
                onChange={(e) => setBlogEngagementFilter(e.target.value)}
              >
                <option value="all">All Blogs</option>
                <option value="zeroLikes">Zero Likes</option>
                <option value="zeroShares">Zero Shares</option>
                <option value="zeroComments">Zero Comments</option>
              </select>
            </div>

            <button type="button" className="export-btn" onClick={exportUsersCsv}>
              <DownloadIcon />
              Export Users CSV
            </button>

            <button type="button" className="export-btn" onClick={exportBlogsCsv}>
              <DownloadIcon />
              Export Blogs CSV
            </button>
          </div>
        </section>

        {loading ? (
          <div className="users-list-container">
            <div className="section-empty">Loading dashboard data...</div>
          </div>
        ) : (
          <>
            {openSection === "users" &&
              renderUserList({
                title: "Users",
                usersList: filteredUsers,
                emptyText: "No users found.",
              })}

            {openSection === "admins" &&
              renderUserList({
                title: "Admins",
                titleClass: "admins-list-heading",
                badgeClass: "admin-badge",
                usersList: filteredAdmins,
                emptyText: "No admins found.",
              })}

            {openSection === "authors" &&
              renderUserList({
                title: "Authors",
                titleClass: "authors-list-heading",
                badgeClass: "author-badge",
                usersList: filteredAuthors,
                emptyText: "No authors found.",
              })}

            {openSection === "verification" &&
              renderUserList({
                title: "Pending Verification Requests",
                titleClass: "pending-list-heading",
                badgeClass: "pending-badge",
                usersList: filteredVerificationUsers,
                emptyText: "No pending verification requests.",
                allowVerificationActions: true,
              })}

            {openSection === "blogs" && renderBlogList()}

            <section className="dashboard-grid">
              <div className="chart-box">
                <div className="card-head">
                  <h3>User Overview</h3>
                  <span className="muted-text">Gender distribution</span>
                </div>

                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={5}
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index]} />
                      ))}
                    </Pie>

                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="center-label"
                    >
                      {totalUsers}
                      <tspan x="50%" dy="1.5em" fontSize="12">
                        Users
                      </tspan>
                    </text>

                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        border: `1px solid ${tooltipBorder}`,
                        borderRadius: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="legend">
                  <div className="legend-item male">
                    <MaleIcon className="legend-icon male-icon" />
                    <span>
                      Male: {maleCount} ({malePercent}%)
                    </span>
                  </div>

                  <div className="legend-item female">
                    <FemaleIcon className="legend-icon female-icon" />
                    <span>
                      Female: {femaleCount} ({femalePercent}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="chart-box">
                <div className="graph-header">
                  <div className="card-head">
                    <h3>Blog Analytics</h3>
                    <span className="muted-text">Posts performance overview</span>
                  </div>

                  <select value={graphType} onChange={(e) => setGraphType(e.target.value)}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={graphData}>
                    <XAxis dataKey="label" stroke={axisColor} />
                    <YAxis stroke={axisColor} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        border: `1px solid ${tooltipBorder}`,
                        borderRadius: 12,
                      }}
                    />
                    <Bar dataKey="posts" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mini-stat-row">
                  <div className="mini-stat">
                    <strong>{thisWeekPosts}</strong>
                    <span>This Week</span>
                  </div>
                  <div className="mini-stat">
                    <strong>{thisMonthPosts}</strong>
                    <span>This Month</span>
                  </div>
                  <div className="mini-stat">
                    <strong>{blogs.length}</strong>
                    <span>Total</span>
                  </div>
                </div>
              </div>

              <div className="chart-box">
                <div className="card-head">
                  <h3>Role & Posting Rules</h3>
                  <span className="muted-text">Current role system</span>
                </div>

                <div className="policy-list">
                  {roleStats.map((item) => (
                    <div key={item.key} className={`policy-item tone-${item.tone}`}>
                      <div>
                        <strong>{item.label}</strong>
                        <p>{item.description}</p>
                      </div>
                      <span>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-box leaderboard-card">
                <div className="card-head">
                  <h3>Top Creators</h3>
                  <span className="muted-text">Highest posting authors</span>
                </div>

                {topCreators.length > 0 ? (
                  topCreators.map((creator, index) => (
                    <div
                      key={creator.id}
                      className={`leaderboard-item clickable ${index === 0 ? "top-rank" : ""}`}
                      onClick={() => handleCreatorClick(creator)}
                    >
                      <span className="rank">
                        {index === 0 ? (
                          <EmojiEventsIcon className="crown-icon" />
                        ) : index === 1 ? (
                          "🥈"
                        ) : index === 2 ? (
                          "🥉"
                        ) : (
                          `#${index + 1}`
                        )}
                      </span>

                      <img
                        src={creator.profileImageUrl || "https://via.placeholder.com/60"}
                        className="leaderboard-img"
                        alt="creator"
                      />

                      <div className="leaderboard-info">
                        <p className="creator-name">{creator.name || "Unknown"}</p>
                        <small>{creator.postCount} Posts</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="section-empty">No creator data available.</div>
                )}
              </div>

              <div
                className="chart-box post-highlight-card clickable"
                onClick={() => openHighlightedPost(mostLikedPost)}
              >
                <div className="card-head">
                  <h3>Most Liked Post</h3>
                  <span className="muted-text">Top post by likes</span>
                </div>

                {mostLikedPost ? (
                  <div className="post-highlight-content">
                    <h4>{mostLikedPost.blogTitle || "No Title"}</h4>
                    <p>
                      <strong>Author:</strong>{" "}
                      {userMap.get(mostLikedPost.userID)?.name || "Unknown"}
                    </p>
                    <p>
                      <strong>Likes:</strong> {safeLength(mostLikedPost.like)}
                    </p>
                    <p>
                      <strong>Shares:</strong> {safeLength(mostLikedPost.share)}
                    </p>
                    <p className="highlight-hint">Click to open full post details</p>
                  </div>
                ) : (
                  <div className="section-empty">No liked post data available.</div>
                )}
              </div>

              <div
                className="chart-box post-highlight-card clickable"
                onClick={() => openHighlightedPost(mostSharedPost)}
              >
                <div className="card-head">
                  <h3>Most Shared Post</h3>
                  <span className="muted-text">Top post by shares</span>
                </div>

                {mostSharedPost ? (
                  <div className="post-highlight-content">
                    <h4>{mostSharedPost.blogTitle || "No Title"}</h4>
                    <p>
                      <strong>Author:</strong>{" "}
                      {userMap.get(mostSharedPost.userID)?.name || "Unknown"}
                    </p>
                    <p>
                      <strong>Likes:</strong> {safeLength(mostSharedPost.like)}
                    </p>
                    <p>
                      <strong>Shares:</strong> {safeLength(mostSharedPost.share)}
                    </p>
                    <p className="highlight-hint">Click to open full post details</p>
                  </div>
                ) : (
                  <div className="section-empty">No shared post data available.</div>
                )}
              </div>

              <div
                className="chart-box post-highlight-card clickable"
                onClick={() => openHighlightedPost(mostCommentedPost)}
              >
                <div className="card-head">
                  <h3>Most Commented Post</h3>
                  <span className="muted-text">Top post by comments</span>
                </div>

                {mostCommentedPost ? (
                  <div className="post-highlight-content">
                    <h4>{mostCommentedPost.blogTitle || "No Title"}</h4>
                    <p>
                      <strong>Author:</strong>{" "}
                      {userMap.get(mostCommentedPost.userID)?.name || "Unknown"}
                    </p>
                    <p>
                      <strong>Comments:</strong> {safeLength(mostCommentedPost.comment)}
                    </p>
                    <p>
                      <strong>Likes:</strong> {safeLength(mostCommentedPost.like)}
                    </p>
                    <p className="highlight-hint">Click to open full post details</p>
                  </div>
                ) : (
                  <div className="section-empty">
                    No commented post data available.
                  </div>
                )}
              </div>

              <div className="chart-box">
                <div className="card-head">
                  <h3>Pending Verification</h3>
                  <span className="muted-text">Users waiting for admin review</span>
                </div>

                {pendingVerificationUsers.length > 0 ? (
                  pendingVerificationUsers.slice(0, 5).map((user) => (
                    <div key={user.id} className="simple-list-item">
                      <div>
                        <strong>{user.name || "No Name"}</strong>
                        <p>{user.email || "No Email"}</p>
                      </div>

                      <button
                        type="button"
                        className="mini-open-btn"
                        onClick={() => {
                          setOpenSection("verification");
                          setSelectedUser(user);
                        }}
                      >
                        Open
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="section-empty">No pending requests.</div>
                )}
              </div>

              <div className="chart-box">
                <div className="card-head">
                  <h3>Recent Posts</h3>
                  <span className="muted-text">Latest published content</span>
                </div>

                {recentPosts.length > 0 ? (
                  recentPosts.map((blog) => (
                    <div
                      key={blog.id}
                      className="simple-list-item clickable"
                      onClick={() => openHighlightedPost(blog)}
                    >
                      <div>
                        <strong>{blog.blogTitle || "No Title"}</strong>
                        <p>{userMap.get(blog.userID)?.name || "Unknown"}</p>
                      </div>
                      <span>{formatDate(blog.createdAt)}</span>
                    </div>
                  ))
                ) : (
                  <div className="section-empty">No recent posts found.</div>
                )}
              </div>

              <div className="chart-box">
                <div className="card-head">
                  <h3>Recent Joins</h3>
                  <span className="muted-text">Latest joined users</span>
                </div>

                {recentJoinedUsers.length > 0 ? (
                  recentJoinedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="simple-list-item clickable"
                      onClick={() => {
                        setOpenSection("users");
                        setSelectedUser(user);
                      }}
                    >
                      <div>
                        <strong>{user.name || "No Name"}</strong>
                        <p>{getNormalizedRole(user) === VERIFIED_ROLE ? "VERIFIED USER" : getNormalizedRole(user)}</p>
                      </div>
                      <span>
                        {formatDate(
                          user.createdAt ||
                            user.joinedAt ||
                            user.created_at ||
                            user.dateJoined ||
                            user.updatedAt,
                        )}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="section-empty">No recent joins data available.</div>
                )}
              </div>

              <div className="chart-box">
                <div className="card-head">
                  <h3>Zero Engagement Watch</h3>
                  <span className="muted-text">Posts needing attention</span>
                </div>

                <div className="dual-list">
                  <div>
                    <h4>Zero Likes</h4>
                    {zeroLikesPosts.length > 0 ? (
                      zeroLikesPosts.map((blog) => (
                        <div
                          key={`like-${blog.id}`}
                          className="compact-list-item clickable"
                          onClick={() => openHighlightedPost(blog)}
                        >
                          {blog.blogTitle || "No Title"}
                        </div>
                      ))
                    ) : (
                      <div className="section-empty small-empty">No zero-like posts.</div>
                    )}
                  </div>

                  <div>
                    <h4>Zero Shares</h4>
                    {zeroSharesPosts.length > 0 ? (
                      zeroSharesPosts.map((blog) => (
                        <div
                          key={`share-${blog.id}`}
                          className="compact-list-item clickable"
                          onClick={() => openHighlightedPost(blog)}
                        >
                          {blog.blogTitle || "No Title"}
                        </div>
                      ))
                    ) : (
                      <div className="section-empty small-empty">No zero-share posts.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="chart-box">
                <div className="card-head">
                  <h3>Quick Insights</h3>
                  <span className="muted-text">Fast overview</span>
                </div>

                <div className="insight-grid">
                  <div className="insight-card">
                    <ArticleIcon />
                    <div>
                      <strong>{blogs.length}</strong>
                      <span>Total Posts</span>
                    </div>
                  </div>

                  <div className="insight-card">
                    <VerifiedIcon />
                    <div>
                      <strong>{verifiedUsers.length}</strong>
                      <span>Verified Users</span>
                    </div>
                  </div>

                  <div className="insight-card">
                    <CommentIcon />
                    <div>
                      <strong>{safeLength(mostCommentedPost?.comment)}</strong>
                      <span>Top Comments</span>
                    </div>
                  </div>

                  <div className="insight-card">
                    <NotificationsNoneIcon />
                    <div>
                      <strong>{allNotifications.length}</strong>
                      <span>Notifications</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;