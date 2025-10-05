import react, { useState } from "react";
import "./index.css";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import IconButton from "@mui/material/IconButton";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import InputAdornment from "@mui/material/InputAdornment";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { getFirestore, doc, setDoc, Firestore } from "firebase/firestore";
const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => event.preventDefault();
  const handleMouseUpPassword = (event) => event.preventDefault();
  const signUpHandler = async () => {
    if (name === "") {
      // alert("Name required");
      toast.error("Name required...!!!", {
        position: "top-right",
      });
    } else if (email === "") {
      toast.error("Email required...!!!", {
        position: "top-right",
      });
    } else if (password === "") {
      toast.error("Password required...!!!", {
        position: "top-right",
      });
    } else {
      setLoading(true);
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Signed up
          const user = userCredential.user;

          sendEmailVerification(auth.currentUser).then(async () => {
            // Email verification sent!
            await setDoc(doc(db, "users-dk-news-blog", user.uid), {
              name: name,
              email: email,
              role: "USER",
              isVerifiedApplied: false,
            });
            toast.success("Success...!!!", {
              position: "top-right",
            });
            setLoading(false);
            const usersData = {
              name: name,
              email: email,
            };
            navigate("/email-verify");
          });
        })
        .catch((error) => {
          const errorMessage = error.message;
          toast.error(errorMessage, {
            position: "top-right",
          });
          setLoading(false);
        });

      setName("");
      setEmail("");
      setPassword("");
    }
  };
  return (
    <div>
      <Box className="signUp-box">
        <Grid container className="signUp-container">
          <Grid item xs={12} sm={8} md={6} lg={4} className="signUp-card">
            <h1 className="signUp-title">SIGN UP</h1>
            <div>
              <TextField
                label="Username"
                variant="outlined"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                className="signUp-input"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccountCircleOutlinedIcon />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                style={{ marginTop: "15px" }}
                label="Email Address"
                variant="outlined"
                fullWidth
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="signUp-input"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </div>
            <FormControl
              style={{ marginTop: "15px" }}
              fullWidth
              variant="outlined"
              className="signUp-input"
            >
              <InputLabel htmlFor="password">Password</InputLabel>
              <OutlinedInput
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <LockOutlinedIcon />
                  </InputAdornment>
                }
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      onMouseUp={handleMouseUpPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label="Password"
              />
            </FormControl>

            <Button
              style={{ marginTop: "15px" }}
              variant="contained"
              fullWidth
              className="signUp-button"
              onClick={signUpHandler}
            >
              {loading ? (
                <CircularProgress style={{ color: "white" }} size={20} />
              ) : (
                "Sign Up"
              )}
            </Button>
            <span className="no-Account">
              Already have account!{" "}
              <a onClick={() => navigate("/sign-in")}>Sign In</a>
            </span>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default SignUp;
