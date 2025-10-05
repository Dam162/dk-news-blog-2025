import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./index.css";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { toast } from "react-toastify";
import CircularProgress from "@mui/material/CircularProgress";

// import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const ForgotPassword = () => {
  const navigate = useNavigate();
  //   const auth = getAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div>
      <Box className="signUp-box">
        <Grid container className="signUp-container">
          <Grid item xs={12} sm={8} md={6} lg={4} className="signUp-card">
            <h1 className="signUp-title">RESET PASSWORD</h1>
            <p className="enterPassword">Enter your email to reset password.</p>
            <p className="passwordParagraph">
              Note: A password reset link has been sent to your email. Please
              check your inbox after resetting your password.
            </p>
            <div>
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

            <Button
              style={{ marginTop: "15px" }}
              variant="contained"
              fullWidth
              className="resetPass-button"
              //   onClick={forgotPasswordHandler}
            >
              {loading ? (
                <CircularProgress style={{ color: "white" }} size={20} />
              ) : (
                "Reset Password"
              )}
            </Button>
            <span className="no-Account">
              <a onClick={() => navigate("/sign-in")}>Sign In</a>
            </span>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default ForgotPassword;
