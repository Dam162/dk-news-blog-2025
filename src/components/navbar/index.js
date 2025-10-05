import React, { useEffect, useState } from "react";
import "./index.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, NavLink } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, onSnapshot } from "firebase/firestore"; // 🔹 Firestore
import "@fortawesome/fontawesome-free/css/all.min.css";
import { ROLES } from "../../context/role";

const Navbar = () => {
  const auth = getAuth();
  const db = getFirestore();
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null); // 🔹 Track user role
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showCancelIcon, setShowCancelIcon] = useState(false);
  const [blogsData, setBlogsData] = useState([]);

  // 🔹 Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);

        const docRef = doc(db, "users-dk-news-blog", user.uid);

        // 🔹 Real-time role listener
        const unsubDoc = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const userRole = docSnap.data().role;
            setRole(userRole?.toUpperCase());
            console.log("User role updated:", userRole);
          }
        });

        return () => unsubDoc();
      } else {
        setIsLoggedIn(false);
        setRole(null);
      }
    });

    return () => unsubscribe();
  }, [auth, db]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  console.log("isLoggedIn:", isLoggedIn);
  console.log("role:", role);
  // 🔹 Nav Items
  const NavItems = [
    { title: "Home", url: "/", icon: "fa-solid fa-house", cName: "nav-links" },
    {
      title: "Profile",
      url: "/profile",
      icon: "fa-solid fa-user",
      cName: "nav-links",
    },
    // Admin will be conditionally rendered
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: "fa-solid fa-gauge-high",
      cName: "nav-links",
    },
    {
      title: "Create-Post",
      url: "/create-blog",
      icon: "fa-solid fa-calendar-plus",
      cName: "nav-links",
    },
  ];

  const handleClick = () => setOpen(!open);
  const handleLogin = () => navigate("/sign-in");

  const handleLogout = async () => {
    await signOut(auth)
      .then(() => toast.success("Signed out Successfully..!"))
      .catch((error) => toast.error(error.message));
    setIsLoggedIn(false);
    setRole(null);
  };

  return (
    <nav className={`NavbarItems ${scrolled ? "scrolled" : ""}`}>
      <h3 className="logo" onClick={() => navigate("/")}>
        <i className="fab fa-react"></i> DK News Blog
      </h3>

      <div className={`search-container ${!isLoggedIn ? "wide" : ""}`}>
        <input
          type="text"
          placeholder="Search..."
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* 🔍 Search icon (visible before search) */}
        {!showCancelIcon ? (
          <i
            className="fas fa-search search-icon"
            style={{ cursor: "pointer" }}
            onClick={() => {
              if (search.trim()) {
                navigate("/", { state: { searchQuery: search.trim() } });
                setShowCancelIcon(true); // ✅ show cancel only after actual search
              } else {
                navigate("/", { state: {} });
              }
            }}
          ></i>
        ) : (
          // ❌ Cancel icon (visible after search)
          <i
            className="fas fa-times search-cancel-icon"
            style={{ cursor: "pointer", color: "red" }}
            onClick={() => {
              setSearch("");
              setShowCancelIcon(false); // hide cancel
              navigate("/", { state: {} }); // show all blogs again
            }}
          ></i>
        )}
      </div>

      <div className="Hamburger-Cross-Icons" onClick={handleClick}>
        <i className={open ? "fas fa-times" : "fas fa-bars"}></i>
      </div>

      <ul className={open ? "MenuItems active" : "MenuItems"}>
        {isLoggedIn &&
          NavItems.map((Item, index) => {
            // ✅ Dashboard always shows to logged-in users
            if (Item.title === "Dashboard") {
              return (
                <li className="menu-list" key={index}>
                  <NavLink
                    to={Item.url}
                    className={({ isActive }) =>
                      isActive ? `${Item.cName} active` : Item.cName
                    }
                  >
                    <i className={Item.icon}></i> {Item.title}
                  </NavLink>
                </li>
              );
            }

            // ✅ Other items (Home, Profile, Create-Post)
            if (Item.title !== "Dashboard") {
              return (
                <li className="menu-list" key={index}>
                  <NavLink
                    to={Item.url}
                    className={({ isActive }) =>
                      isActive ? `${Item.cName} active` : Item.cName
                    }
                  >
                    <i className={Item.icon}></i> {Item.title}
                  </NavLink>
                </li>
              );
            }

            return null;
          })}

        {/* 🔹 Only show Admin if role is ADMIN */}
        {isLoggedIn && role === ROLES.ADMIN && (
          <li className="menu-list">
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                isActive ? "nav-links active" : "nav-links"
              }
            >
              <i className="fa-solid fa-user-tie"></i> Admin
            </NavLink>
          </li>
        )}

        {!isLoggedIn && (
          <li className="menu-list">
            <button className="nav-button" onClick={handleLogin}>
              Login
            </button>
          </li>
        )}

        {isLoggedIn && (
          <li className="menu-button">
            <button
              id="nav-button"
              className="nav-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
