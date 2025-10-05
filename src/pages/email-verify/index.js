import React, { useEffect, useState } from "react";
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
  onAuthStateChanged,
  reload,
  sendEmailVerification,
} from "firebase/auth";

const EmailVerify = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [resendLoader, setResedLoader] = useState(false);
  const [email, setEmail] = useState("");
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const uid = user.uid;
        if (user.emailVerified) {
          navigate("/");
        } else {
          setLoading(false);
          setEmail(user.email);
        }
      } else {
        navigate("/sign-in");
      }
    });
  }, []);

  //   resend emial handler
  const resendHandler = () => {
    setResedLoader(true);
    sendEmailVerification(auth.currentUser)
      .then(() => {
        setResedLoader(false);
        toast.success("Email Verification resent successfully...!!!", {
          position: "top-right",
        });
      })
      .catch((error) => {
        setResedLoader(false);
        const errorMessage = error.message;
        toast.error(errorMessage, {
          position: "top-right",
        });
      });
  };
  return (
    <div>
      <Box className="signUp-box">
        <Grid container className="signUp-container">
          <Grid item xs={12} sm={8} md={6} lg={4} className="signUp-card">
            <h1 className="signUp-title">Email Verification</h1>

            <p className="emailVerify">
              Email verification has been sent successefully on your given email
              ({loading ? "Loading ...!" : email}), Please verify it first.
            </p>
            <Button
              style={{ marginTop: "15px" }}
              variant="contained"
              fullWidth
              className="signUp-button"
              onClick={resendHandler}
            >
              {resendLoader ? (
                <CircularProgress style={{ color: "white" }} size={20} />
              ) : (
                "Resend"
              )}
            </Button>
            <Button
              style={{ marginTop: "15px" }}
              variant="contained"
              fullWidth
              onClick={() => navigate("/")}
              className="signUp-button"
            >
              Go Home
            </Button>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};
export default EmailVerify;
