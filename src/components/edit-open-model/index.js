import React, { use, useEffect, useRef, useState } from "react";
// import Button from "react-bootstrap/Button";
// import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import "./index.css";
import { ROLES } from "../../context/role";
import { FileUpload } from "primereact/fileupload";
import { ProgressBar } from "primereact/progressbar";
import CircularProgress from "@mui/material/CircularProgress";
import { toast } from "react-toastify";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";
import { Tag } from "primereact/tag";
import moment from "moment";
import "./index.css";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
// import label from "react-bootstrap/esm/Label";
import {
  doc,
  getFirestore,
  updateDoc,
  collection,
  addDoc,
  getDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

const MIN_TITLE_WORDS = 10;
const MIN_DETAIL_WORDS = 50;

function EditPostModal({ open, handleClose, data }) {
  console.log("data in edit modal:", data);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [fileURL, setFileURL] = useState("");
  const [fileType, setFileType] = useState("");
  // const [follow, setFollow] = useState([]);
  const [uid, setUid] = useState("");
  const navigate = useNavigate();
  const uuid = uuidv4();
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  const [totalSize, setTotalSize] = useState(0);
  const fileUploadRef = useRef(null);

  const titleWords = countWords(title);
  const detailWords = countWords(details);

  // role
  const [role, setRole] = useState(ROLES.USER);
  const [postCount, setPostCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    if (data) {
      setTitle(data?.blogTitle);
      setDetails(data?.blogDetails);
      setFileURL(data?.fileURL);
      setFileType(data?.fileType);
    }
  }, [data]);

  const readyToSubmit =
    hasUploaded &&
    uploadProgress === 0 &&
    titleWords >= MIN_TITLE_WORDS &&
    detailWords >= MIN_DETAIL_WORDS;

  function countWords(text) {
    return text.trim().length === 0
      ? 0
      : text.trim().replace(/\s+/g, " ").split(" ").filter(Boolean).length;
  }

  const onTemplateRemove = (file, removeFile) => {
    setTotalSize((prev) => prev - file.size);
    removeFile();
    setFile(null);
  };

  const onTemplateClear = () => {
    setTotalSize(0);
    setFile(null);
  };
  const headerTemplate = (options) => {
    const { className, chooseButton, cancelButton } = options;

    return (
      <div className={className + " custom-header"}>
        {chooseButton}
        {cancelButton}
        <div className="header-progress">
          <ProgressBar
            value={uploadProgress}
            showValue={false}
            className="header-progress-bar"
          />
          <span>{uploadProgress}%</span>
        </div>
      </div>
    );
  };
  const itemTemplate = (file, options) => {
    const isVideo = file.type.startsWith("video/");

    return (
      <div className="file-item">
        <div className="file-info">
          <div className="file-preview-div">
            {isVideo ? (
              <video controls src={file.objectURL} className="file-preview" />
            ) : (
              <img
                alt={file.name}
                role="presentation"
                src={file.objectURL}
                className="file-preview"
              />
            )}
          </div>
          <span className="file-name">
            {file.name}
            <small>{new Date().toLocaleDateString()}</small>
          </span>
        </div>
        <Tag
          value={options.formatSize}
          severity="warning"
          className="file-size"
        />
        <Button
          type="button"
          icon="pi pi-times"
          className="p-button-rounded p-button-danger p-button-outlined remove-btn"
          onClick={() => onTemplateRemove(file, options.onRemove)}
        />
      </div>
    );
  };
  const emptyTemplate = () => {
    return (
      <div className="empty-drop">
        <i className="pi pi-image upload-icon"></i>
        <span className="upload-text">Drag & Drop Image Here</span>
      </div>
    );
  };

  const chooseOptions = {
    icon: "pi pi-fw pi-images",
    iconOnly: true,
    className: "custom-choose-btn p-button-rounded p-button-outlined",
  };

  const cancelOptions = {
    icon: "pi pi-fw pi-times",
    iconOnly: true,
    className:
      "custom-cancel-btn p-button-danger p-button-rounded p-button-outlined",
  };

  // ---- FileUpload Handlers ----
  const onTemplateSelect = (e) => {
    let _totalSize = totalSize;
    let files = e.files;
    Object.keys(files).forEach((key) => {
      _totalSize += files[key].size || 0;
    });
    setTotalSize(_totalSize);
    if (files[0]) {
      const selectedFile = files[0];
      setFile(selectedFile);
      if (
        selectedFile?.type?.slice(0, 5) === "image" ||
        selectedFile?.type?.slice(0, 5) === "video"
      ) {
        const storageRef = ref(storage, `dk-newsBlog-createPostImages/${uuid}`);
        const uploadTask = uploadBytesResumable(storageRef, selectedFile);
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(Math.round(progress));
          },
          (error) => {
            console.error("Upload error:", error);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              // const blogRef = doc(
              //   db,
              //   "createPost-dk-news-blog",
              //   data?.blogID
              // );
              // await updateDoc(blogRef, {
              //   fileURL: downloadURL,
              //   fileType: selectedFile?.type?.slice(0, 5),
              // });

              setFileURL(downloadURL);
              setFileType(selectedFile?.type?.slice(0, 5));
              setUploadProgress(0);
              setHasUploaded(true);
            });
          }
        );
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const newsBlog = {
      fileURL,
      blogTitle: title,
      blogDetails: details,
      fileType,
    };
    const blogRef = doc(db, "createPost-dk-news-blog", data?.blogID);
    await updateDoc(blogRef, newsBlog);
    try {
      toast.success("Blog post updated successfully");
    } catch (error) {
      console.error("Error updating blog post:", error);
      toast.error("Failed to update blog post");
    } finally {
      setLoading(false);
      handleClose();
    }
  };
  return (
    <Modal
      show={open}
      onHide={handleClose}
      centered
      dialogClassName="custom-modal-dialog"
      contentClassName="custom-modal-content"
      backdropClassName="custom-modal-backdrop"
      bodyClassName="custom-modal-body"
    >
      <div className="cbp-page">
        <form className="cbp-card" onSubmit={handleSubmit}>
          <header className="cbp-header">
            <h1>Edit Blog Post</h1>
          </header>

          {/* Uploader */}
          <section className="cbp-section">
            <label className="cbp-label">Media (Image or Video)</label>
            <Box sx={{ flexGrow: 1 }} className="file-Upload-Test">
              <Grid container spacing={2}>
                <Grid
                  size={{ xl: 10, lg: 9, md: 9, sm: 12, xs: 12 }}
                  className="now-uplaod"
                >
                  <Tooltip
                    target=".custom-choose-btn"
                    content="Choose"
                    position="bottom"
                  />
                  <Tooltip
                    target=".custom-cancel-btn"
                    content="Clear"
                    position="bottom"
                  />

                  {/* <FileUpload
                ref={fileUploadRef}
                name="demo[]"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.mp4,.mov"
                maxFileSize={524288000}
                onSelect={onTemplateSelect}
                onError={onTemplateClear}
                onClear={onTemplateClear}
                headerTemplate={headerTemplate}
                itemTemplate={itemTemplate}
                emptyTemplate={emptyTemplate}
                chooseOptions={chooseOptions}
                cancelOptions={cancelOptions}
              /> */}

                  {/* 🔹 File uploader for replacing old media */}
                  <FileUpload
                    ref={fileUploadRef}
                    name="demo[]"
                    multiple
                    accept=".jpg,.jpeg,.png,.gif,.mp4,.mov"
                    maxFileSize={524288000}
                    onSelect={onTemplateSelect}
                    onError={onTemplateClear}
                    onClear={onTemplateClear}
                    headerTemplate={headerTemplate}
                    itemTemplate={itemTemplate}
                    emptyTemplate={emptyTemplate}
                    chooseOptions={chooseOptions}
                    cancelOptions={cancelOptions}
                  />
                </Grid>
                <Grid
                  size={{ xl: 2, lg: 3, md: 3, sm: 12, xs: 12 }}
                  className="existing-upload"
                >
                  {/* 🔹 Existing uploaded file preview (initially show old media) */}
                  {fileURL && (
                    <div className="existing-file-preview">
                      {fileType === "video" ? (
                        <video
                          controls
                          src={fileURL}
                          style={{
                            width: "100% !important",
                            height: "100% !important",
                            borderRadius: "10px",
                            // boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                            objectFit: "contain",
                          }}
                        />
                      ) : (
                        <img
                          src={fileURL}
                          alt="Uploaded file"
                          style={{
                            width: "100%",
                            height: "100% !important",
                            borderRadius: "10px",
                            // boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                            objectFit: "contain",
                          }}
                        />
                      )}
                      {/* <p
                      style={{
                        fontSize: "0.9rem",
                        color: "#555",
                        textAlign: "center",
                        marginTop: "0.5rem",
                      }}
                    >
                      Current uploaded media
                    </p> */}
                    </div>
                  )}
                </Grid>
              </Grid>
            </Box>
          </section>

          {/* Title */}
          <section className="cbp-section">
            <label className="cbp-label">
              Post Title{" "}
              <span className={titleWords >= MIN_TITLE_WORDS ? "ok" : "warn"}>
                ({titleWords}/{MIN_TITLE_WORDS} words)
              </span>
            </label>
            <input
              type="text"
              className="cbp-input"
              placeholder="Enter a clear, descriptive title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div
              className={`cbp-hint ${
                titleWords >= MIN_TITLE_WORDS ? "ok" : "warn"
              }`}
            >
              {titleWords >= MIN_TITLE_WORDS
                ? "Looks good."
                : `At least ${MIN_TITLE_WORDS} words required.`}
            </div>
          </section>

          {/* Details */}
          <section className="cbp-section">
            <label className="cbp-label">
              Post Details{" "}
              <span className={detailWords >= MIN_DETAIL_WORDS ? "ok" : "warn"}>
                ({detailWords}/{MIN_DETAIL_WORDS} words)
              </span>
            </label>
            <textarea
              className="cbp-textarea"
              rows={3}
              placeholder="Write your post details here..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
            <div
              className={`cbp-hint ${
                detailWords >= MIN_DETAIL_WORDS ? "ok" : "warn"
              }`}
            >
              {detailWords >= MIN_DETAIL_WORDS
                ? "Nice! Your post has enough detail."
                : `Write at least ${MIN_DETAIL_WORDS} words.`}
            </div>
          </section>

          {/* Actions */}
          <footer className="cbp-footer">
            <button type="button" className="cancel-btn" onClick={handleClose}>
              Cancel
            </button>
            <button
              type="button"
              className="cbp-btn ghost"
              onClick={() => {
                setFile(null);
                setTitle("");
                setDetails("");
                setUploadProgress(0);
                setTotalSize(0);
                setHasUploaded(false);
                setFileURL("");

                if (fileUploadRef.current) {
                  fileUploadRef.current.clear();
                }
              }}
            >
              Reset
            </button>

            <button
              type="submit"
              className="cbp-btn primary"
              disabled={!readyToSubmit}
              title={
                readyToSubmit
                  ? "Submit your post"
                  : "Complete all fields to enable"
              }
            >
              {loading ? (
                <CircularProgress style={{ color: "white" }} size={15} />
              ) : (
                "Create Post"
              )}
            </button>
          </footer>
        </form>
      </div>
    </Modal>
  );
}

export default EditPostModal;
