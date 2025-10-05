import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { useNavigate } from "react-router-dom";
import "./index.css";

export default function BasicModal({ open, handleClose }) {
  const navigate = useNavigate();

  return (
    <div>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box className="modal-content">
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Please, login first!
          </Typography>
          <Button
            onClick={() => {
              handleClose();
              navigate("/sign-in");
            }}
            variant="contained"
            className="login-btn"
          >
            Login
          </Button>
        </Box>
      </Modal>
    </div>
  );
}
