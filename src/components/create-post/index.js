import React, { useEffect, useRef, useState } from "react";
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
const USER_MONTHLY_LIMIT = 5;

export default function CreatePost() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [fileURL, setFileURL] = useState("");
  const [fileType, setFileType] = useState("");
  const [uid, setUid] = useState("");
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  const [totalSize, setTotalSize] = useState(0);
  const fileUploadRef = useRef(null);

  const titleWords = countWords(title);
  const detailWords = countWords(details);

  const [role, setRole] = useState(ROLES.USER);
  const [postCount, setPostCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [isVerifiedUser, setIsVerifiedUser] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);

  const isAdmin = role === ROLES.ADMIN;
  const canPostUnlimited = isAdmin || isVerifiedUser;

  const readyToSubmit =
    !checkingUser &&
    hasUploaded &&
    uploadProgress === 0 &&
    titleWords >= MIN_TITLE_WORDS &&
    detailWords >= MIN_DETAIL_WORDS &&
    (canPostUnlimited || !limitReached);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          navigate("/");
          return;
        }

        // page access ke liye email verify zaroori
        if (!user.emailVerified) {
          navigate("/email-verify");
          return;
        }

        setUid(user.uid);

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setRole(ROLES.USER);
          setIsVerifiedUser(false);
          setPostCount(0);
          setLimitReached(false);
          return;
        }

        const userData = userSnap.data();

        const currentRole = userData?.role || ROLES.USER;
        const verifiedStatus =
          userData?.isVerified === true ||
          currentRole === ROLES.VERIFIED ||
          currentRole === "VERIFIED";

        setRole(currentRole);
        setIsVerifiedUser(verifiedStatus);

        // sirf normal USER ke liye monthly limit
        if (currentRole === ROLES.USER && !verifiedStatus) {
          const startOfMonth = moment().startOf("month").toISOString();
          const endOfMonth = moment().endOf("month").toISOString();

          const q = query(
            collection(db, "createPost-dk-news-blog"),
            where("userID", "==", user.uid),
            where("createdAt", ">=", startOfMonth),
            where("createdAt", "<=", endOfMonth)
          );

          const querySnap = await getDocs(q);
          const currentPostCount = querySnap.size;

          setPostCount(currentPostCount);
          setLimitReached(currentPostCount >= USER_MONTHLY_LIMIT);
        } else {
          setPostCount(0);
          setLimitReached(false);
        }
      } catch (error) {
        console.error("User check error:", error);
        toast.error("Failed to load user permissions.", {
          position: "top-right",
        });
      } finally {
        setCheckingUser(false);
      }
    });

    return () => unsubscribe();
  }, [auth, db, navigate]);

  function countWords(text) {
    return text.trim().length === 0
      ? 0
      : text.trim().replace(/\s+/g, " ").split(" ").filter(Boolean).length;
  }

  const resetForm = () => {
    setDetails("");
    setFileURL("");
    setFileType("");
    setHasUploaded(false);
    setTitle("");
    setFile(null);
    setUploadProgress(0);
    setTotalSize(0);

    if (fileUploadRef.current) {
      fileUploadRef.current.clear();
    }
  };

  const onTemplateSelect = (e) => {
    let _totalSize = 0;
    const files = e.files || [];

    Object.keys(files).forEach((key) => {
      _totalSize += files[key].size || 0;
    });

    setTotalSize(_totalSize);

    if (files[0]) {
      const selectedFile = files[0];
      const mainType = selectedFile?.type?.split("/")[0];

      setFile(selectedFile);
      setHasUploaded(false);
      setUploadProgress(0);

      if (mainType === "image" || mainType === "video") {
        const uniqueId = uuidv4();
        const storageRef = ref(
          storage,
          `dk-newsBlog-createPostImages/${uniqueId}`
        );
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
            toast.error("File upload failed.", { position: "top-right" });
            setUploadProgress(0);
            setHasUploaded(false);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              setFileURL(downloadURL);
              setFileType(mainType);
              setUploadProgress(0);
              setHasUploaded(true);
            } catch (error) {
              console.error("Download URL error:", error);
              toast.error("Failed to get uploaded file URL.", {
                position: "top-right",
              });
            }
          }
        );
      } else {
        toast.error("Only image or video files are allowed.", {
          position: "top-right",
        });
        resetForm();
      }
    }
  };

  const onTemplateRemove = (selectedFile, removeFile) => {
    setTotalSize((prev) => prev - (selectedFile?.size || 0));
    removeFile();
    setFile(null);
    setFileURL("");
    setFileType("");
    setHasUploaded(false);
    setUploadProgress(0);
  };

  const onTemplateClear = () => {
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (checkingUser) return;

    if (!canPostUnlimited && role === ROLES.USER && postCount >= USER_MONTHLY_LIMIT) {
      toast.error(`You can only create ${USER_MONTHLY_LIMIT} posts per month.`, {
        position: "top-right",
      });
      return;
    }

    if (!fileURL) {
      toast.error("Please upload a file first.", {
        position: "top-right",
      });
      return;
    }

    try {
      setLoading(true);

      const postUUID = uuidv4();

      const newsBlog = {
        fileURL,
        blogTitle: title,
        blogDetails: details,
        like: [],
        comment: [],
        share: [],
        createdAt: moment().toISOString(),
        fileID: postUUID,
        fileType,
        userID: uid,
      };

      const docRef = await addDoc(
        collection(db, "createPost-dk-news-blog"),
        newsBlog
      );

      const blogRef = doc(db, "createPost-dk-news-blog", docRef.id);
      await updateDoc(blogRef, { blogID: docRef.id });

      toast.success("News post created successfully!", {
        position: "top-right",
      });

      if (!canPostUnlimited && role === ROLES.USER) {
        const updatedCount = postCount + 1;
        setPostCount(updatedCount);
        setLimitReached(updatedCount >= USER_MONTHLY_LIMIT);
      }

      resetForm();
    } catch (error) {
      console.error("Create post error:", error);
      toast.error("Something went wrong while creating the post.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const headerTemplate = (options) => {
    const { className, chooseButton, cancelButton } = options;

    return (
      <div className={className + " custom-header"}>
        <div className="upload-actions">
          {chooseButton}
          {cancelButton}
        </div>

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
        <span className="upload-text">Drag & Drop Image or Video Here</span>
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

  return (
    <div className="cbp-page">
      <form className="cbp-card" onSubmit={handleSubmit}>
        <header className="cbp-header">
          <h1>Create New Post</h1>
          <p>Upload media, add a title, and write your story.</p>
        </header>

        <div className="cbp-status-row">
          {checkingUser ? (
            <p className="cbp-status info">Checking user permissions...</p>
          ) : canPostUnlimited ? (
            <p className="cbp-status ok">
              {isAdmin ? "Admin account" : "Verified account"}: unlimited posts
              allowed.
            </p>
          ) : (
            <p className="cbp-status warn">
              User account: {postCount}/{USER_MONTHLY_LIMIT} monthly posts used.
            </p>
          )}
        </div>

        {limitReached && !canPostUnlimited && (
          <div className="cbp-limit-box">
            You have reached your monthly limit of {USER_MONTHLY_LIMIT} posts.
          </div>
        )}

        <section className="cbp-section">
          <label className="cbp-label">Media (Image or Video)</label>
          <div className="file-Upload-Test">
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

            <FileUpload
              ref={fileUploadRef}
              name="demo[]"
              multiple={false}
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
          </div>
        </section>

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

        <section className="cbp-section">
          <label className="cbp-label">
            Post Details{" "}
            <span className={detailWords >= MIN_DETAIL_WORDS ? "ok" : "warn"}>
              ({detailWords}/{MIN_DETAIL_WORDS} words)
            </span>
          </label>

          <textarea
            className="cbp-textarea"
            rows={8}
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

        <footer className="cbp-footer">
          <button type="button" className="cbp-btn ghost" onClick={resetForm}>
            Reset
          </button>

          <button
            type="submit"
            className="cbp-btn primary"
            disabled={!readyToSubmit || loading}
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
  );
}