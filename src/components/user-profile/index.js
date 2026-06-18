import React, { useEffect, useState, useCallback } from "react";
import { Camera, Phone, Mail, Heart, Users, ShieldCheck } from "lucide-react";
import Cropper from "react-easy-crop";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { toast } from "react-toastify";
import "./index.css";

import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  getFirestore,
  updateDoc,
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

const ROLE_ADMIN = "ADMIN";
const ROLE_USER = "USER";
const ROLE_VERIFIED = "VERIFIED_USER";

const SKILL_OPTIONS = [
  "Web Designer",
  "Web Developer",
  "Data Analyst",
  "Data Scientist",
  "Graphic Designer",
  "Resume Designer",
  "Software Engineer",
  "Teacher",
  "Other",
];

const normalizeRole = (role, isVerified = false, verificationStatus = "") => {
  const rawRole = String(role || "").toUpperCase();

  if (rawRole === ROLE_ADMIN) return ROLE_ADMIN;
  if (
    rawRole === ROLE_VERIFIED ||
    isVerified ||
    String(verificationStatus || "").toUpperCase() === "APPROVED"
  ) {
    return ROLE_VERIFIED;
  }

  return ROLE_USER;
};

const normalizeVerificationStatus = (
  verificationStatus = "",
  appliedForVerified = false,
  isVerified = false,
  role = "",
) => {
  const normalizedRole = normalizeRole(role, isVerified, verificationStatus);
  const rawStatus = String(verificationStatus || "").toUpperCase();

  if (normalizedRole === ROLE_VERIFIED || rawStatus === "APPROVED") {
    return "APPROVED";
  }

  if (rawStatus === "REJECTED") return "REJECTED";
  if (rawStatus === "PENDING" || appliedForVerified) return "PENDING";

  return "NONE";
};

const formatFollowers = (num = 0) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(num);
};

const getSkillValueForSelect = (incomingSkill = "") => {
  if (!incomingSkill) {
    return { skill: "", otherSkill: "", showOtherSkillInput: false };
  }

  const exactMatch = SKILL_OPTIONS.find(
    (item) => item.toLowerCase() === String(incomingSkill).toLowerCase(),
  );

  if (exactMatch && exactMatch !== "Other") {
    return {
      skill: exactMatch,
      otherSkill: "",
      showOtherSkillInput: false,
    };
  }

  if (String(incomingSkill).toLowerCase() === "other") {
    return {
      skill: "Other",
      otherSkill: "",
      showOtherSkillInput: true,
    };
  }

  return {
    skill: "Other",
    otherSkill: incomingSkill,
    showOtherSkillInput: true,
  };
};

const UserProfile = () => {
  const storage = getStorage();
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();

  const [uid, setUid] = useState("");
  const [userDocId, setUserDocId] = useState("");

  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState("");
  const [skill, setSkill] = useState("");
  const [otherSkill, setOtherSkill] = useState("");
  const [showOtherSkillInput, setShowOtherSkillInput] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [role, setRole] = useState(ROLE_USER);
  const [appliedForVerified, setAppliedForVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("NONE");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverPosition, setCoverPosition] = useState(50);
  const [originalCover, setOriginalCover] = useState("");
  const [originalCoverPosition, setOriginalCoverPosition] = useState(50);
  const [isAdjustingCover, setIsAdjustingCover] = useState(false);
  const [pendingCoverFile, setPendingCoverFile] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");

  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [originalProfile, setOriginalProfile] = useState("");
  const [followers, setFollowers] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const [isCropping, setIsCropping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const displaySkill = skill === "Other" ? otherSkill : skill;

  const isProfileComplete = () => {
    return (
      name.trim() &&
      fatherName.trim() &&
      dob &&
      age &&
      displaySkill.trim() &&
      gender &&
      phone.trim()
    );
  };

  const isVerifiedUser = role === ROLE_VERIFIED || verificationStatus === "APPROVED";
  const isAdminUser = role === ROLE_ADMIN;
  const isPendingVerification = verificationStatus === "PENDING";
  const isRejectedVerification = verificationStatus === "REJECTED";

  const postingAccessText =
    role === ROLE_ADMIN || role === ROLE_VERIFIED ? "Unlimited Posts" : "5 Posts Limit";

  const postingAccessStat =
    role === ROLE_ADMIN || role === ROLE_VERIFIED ? "Unlimited" : "5 Posts";

  const fillUserState = (data = {}, finalDocId = "") => {
    const normalizedRole = normalizeRole(
      data.role,
      data.isVerified,
      data.verificationStatus,
    );

    const normalizedStatus = normalizeVerificationStatus(
      data.verificationStatus,
      data.appliedForVerified,
      data.isVerified,
      data.role,
    );

    const incomingSkill = getSkillValueForSelect(data.skill || "");

    setUserDocId(finalDocId);
    setName(data.name || "");
    setEmail(data.email || "");
    setPhone(data.phone || "");
    setFatherName(data.fatherName || "");
    setDob(data.dob || "");
    setAge(data.age || "");
    setGender(data.gender || "");
    setProfileImageUrl(data.profileImageUrl || "");
    setOriginalProfile(data.profileImageUrl || "");
    setCoverImageUrl(data.coverImageUrl || "");
    setOriginalCover(data.coverImageUrl || "");
    setCoverPosition(data.coverPosition ?? 50);
    setOriginalCoverPosition(data.coverPosition ?? 50);
    setRole(normalizedRole);
    setAppliedForVerified(Boolean(data.appliedForVerified));
    setVerificationStatus(normalizedStatus);
    setFollowers(Array.isArray(data.followers) ? data.followers : []);
    setFavorites(Array.isArray(data.favorites) ? data.favorites : []);

    setSkill(incomingSkill.skill);
    setOtherSkill(incomingSkill.otherSkill);
    setShowOtherSkillInput(incomingSkill.showOtherSkillInput);
  };

  useEffect(() => {
    let unsubscribeUserDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/");
        return;
      }

      if (!user.emailVerified) {
        navigate("/email-verify");
        return;
      }

      setUid(user.uid);

      try {
        const directRef = doc(db, "users-dk-news-blog", user.uid);

        unsubscribeUserDoc = onSnapshot(directRef, async (directSnap) => {
          if (directSnap.exists()) {
            fillUserState(directSnap.data(), directSnap.id);
            return;
          }

          const q = query(
            collection(db, "users-dk-news-blog"),
            where("uid", "==", user.uid),
          );

          const res = await getDocs(q);

          if (!res.empty) {
            const matchedDoc = res.docs[0];
            fillUserState(matchedDoc.data(), matchedDoc.id);
            return;
          }

          const emailQuery = query(
            collection(db, "users-dk-news-blog"),
            where("email", "==", user.email),
          );

          const emailRes = await getDocs(emailQuery);

          if (!emailRes.empty) {
            const matchedDoc = emailRes.docs[0];
            fillUserState(matchedDoc.data(), matchedDoc.id);
            return;
          }

          toast.error("User profile not found");
        });
      } catch (error) {
        console.error(error);
        toast.error("Unable to load profile");
      }
    });

    return () => {
      if (unsubscribeUserDoc) unsubscribeUserDoc();
      unsubscribeAuth();
    };
  }, [auth, db, navigate]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [previewUrl, coverPreviewUrl]);

  const getCroppedImg = (imageSrc, cropArea) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = imageSrc;

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = cropArea.width;
        canvas.height = cropArea.height;
        const ctx = canvas.getContext("2d");

        ctx.drawImage(
          image,
          cropArea.x,
          cropArea.y,
          cropArea.width,
          cropArea.height,
          0,
          0,
          cropArea.width,
          cropArea.height,
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas is empty"));
              return;
            }
            resolve(blob);
          },
          "image/jpeg",
          0.92,
        );
      };

      image.onerror = (error) => reject(error);
    });
  };

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSkillChange = (e) => {
    const value = e.target.value;
    setSkill(value);
    setShowOtherSkillInput(value === "Other");

    if (value !== "Other") {
      setOtherSkill("");
    }
  };

  const handleDobChange = (value) => {
    setDob(value);

    if (!value) {
      setAge("");
      return;
    }

    const today = new Date();
    const birthDate = new Date(value);
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();

    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      calculatedAge -= 1;
    }

    setAge(calculatedAge);
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);

    const preview = URL.createObjectURL(file);
    setCoverPreviewUrl(preview);
    setCoverImageUrl(preview);
    setPendingCoverFile(file);
    setIsAdjustingCover(true);
  };

  const handleSaveCover = async () => {
    if (!userDocId) return;

    try {
      const userRef = doc(db, "users-dk-news-blog", userDocId);

      if (pendingCoverFile) {
        const storageRef = ref(storage, `dk-newsBlog-coverImages/${uid}`);
        const uploadTask = uploadBytesResumable(storageRef, pendingCoverFile);

        uploadTask.on(
          "state_changed",
          undefined,
          (error) => {
            console.error("Cover upload error:", error);
            toast.error("Cover upload failed");
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            await updateDoc(userRef, {
              coverImageUrl: downloadURL,
              coverPosition,
            });

            setCoverImageUrl(downloadURL);
            setOriginalCover(downloadURL);
            setOriginalCoverPosition(coverPosition);
            setPendingCoverFile(null);
            setIsAdjustingCover(false);

            if (coverPreviewUrl) {
              URL.revokeObjectURL(coverPreviewUrl);
              setCoverPreviewUrl("");
            }

            toast.success("Cover photo updated");
          },
        );
      } else {
        await updateDoc(userRef, { coverPosition });
        setOriginalCoverPosition(coverPosition);
        setIsAdjustingCover(false);
        toast.success("Cover position updated");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to save cover changes");
    }
  };

  const handleCancelCover = () => {
    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
      setCoverPreviewUrl("");
    }

    setCoverImageUrl(originalCover || "");
    setCoverPosition(originalCoverPosition);
    setPendingCoverFile(null);
    setIsAdjustingCover(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    const localPreview = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(localPreview);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setIsCropping(true);
  };

  const handleSaveCropped = async () => {
    if (!previewUrl || !croppedAreaPixels || !uid || !userDocId) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const croppedBlob = await getCroppedImg(previewUrl, croppedAreaPixels);
      const storageRef = ref(storage, `dk-newsBlog-profileImages/${uid}`);
      const uploadTask = uploadBytesResumable(storageRef, croppedBlob);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          );
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Profile upload error:", error);
          toast.error("Profile image upload failed");
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await updateDoc(doc(db, "users-dk-news-blog", userDocId), {
            profileImageUrl: downloadURL,
          });

          setProfileImageUrl(downloadURL);
          setOriginalProfile(downloadURL);
          setIsCropping(false);
          setSelectedFile(null);

          if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }

          setUploading(false);
          setUploadProgress(0);
          toast.success("Profile photo updated");
        },
      );
    } catch (error) {
      console.error(error);
      toast.error("Image crop failed");
      setUploading(false);
    }
  };

  const handleCancelCrop = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setIsCropping(false);
    setPreviewUrl(null);
    setSelectedFile(null);
    setProfileImageUrl(originalProfile || "");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setUploadProgress(0);
    setUploading(false);
  };

  const updateDataHandler = async () => {
    if (!userDocId) return;

    const finalSkill = skill === "Other" ? otherSkill.trim() : skill.trim();

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!fatherName.trim()) {
      toast.error("Father name is required");
      return;
    }

    if (!gender) {
      toast.error("Gender is required");
      return;
    }

    if (!dob) {
      toast.error("Date of birth is required");
      return;
    }

    if (!age) {
      toast.error("Age is required");
      return;
    }

    if (!finalSkill) {
      toast.error("Skill is required");
      return;
    }

    if (!phone.trim()) {
      toast.error("Phone is required");
      return;
    }

    try {
      await updateDoc(doc(db, "users-dk-news-blog", userDocId), {
        uid,
        email: email || auth.currentUser?.email || "",
        name: name.trim(),
        fatherName: fatherName.trim(),
        phone: phone.trim(),
        dob,
        age,
        skill: finalSkill,
        gender,
        followers,
        favorites,
      });

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Unable to update profile");
    }
  };

  const changePasswordHandler = async () => {
    if (!oldPassword) {
      toast.error("Old password is required");
      return;
    }

    if (!newPassword) {
      toast.error("New password is required");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password must match");
      return;
    }

    try {
      const user = auth.currentUser;

      if (!user?.email) {
        toast.error("User not found");
        return;
      }

      const credential = EmailAuthProvider.credential(user.email, oldPassword);

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast.success("Password updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Old password is incorrect");
    }
  };

  const handleApplyVerified = async () => {
    if (!userDocId) return;

    if (!isProfileComplete()) {
      toast.error("Please complete your profile before applying");
      return;
    }

    try {
      await updateDoc(doc(db, "users-dk-news-blog", userDocId), {
        appliedForVerified: true,
        verificationStatus: "PENDING",
        verificationRequestedAt: new Date(),
        isVerified: false,
        role: ROLE_USER,
      });

      setAppliedForVerified(true);
      setVerificationStatus("PENDING");
      setRole(ROLE_USER);

      toast.success("Verification request sent");
    } catch (error) {
      console.error(error);
      toast.error("Unable to send verification request");
    }
  };

  const renderVerificationButton = () => {
    if (isAdminUser) {
      return (
        <>
          <button className="btn admin-btn" disabled>
            Admin
          </button>
          <p className="verification-note info">
            Full access enabled for your account.
          </p>
        </>
      );
    }

    if (isVerifiedUser) {
      return (
        <>
          <button className="btn verified-btn" disabled>
            You are verified user
          </button>
          <p className="verification-note success">
            Your account has verified access with unlimited posting.
          </p>
        </>
      );
    }

    if (isPendingVerification) {
      return (
        <>
          <button className="btn applied-btn" disabled>
            Verification request sent
          </button>
          <p className="verification-note warning">
            Your request is pending admin review.
          </p>
        </>
      );
    }

    if (isRejectedVerification) {
      return (
        <>
          <button
            className="btn apply-btn"
            onClick={handleApplyVerified}
            disabled={!isProfileComplete()}
          >
            Apply Again for Verified User
          </button>
          <p className="verification-note danger">
            Your previous request was rejected. You can apply again.
          </p>
        </>
      );
    }

    return (
      <>
        <button
          className="btn apply-btn"
          onClick={handleApplyVerified}
          disabled={!isProfileComplete()}
        >
          Apply for Verified User
        </button>
        <p className="verification-note muted">
          Complete your profile first, then send a verification request.
        </p>
      </>
    );
  };

  return (
    <div className="user-profile-wrapper">
      <div className="profile-card same-height-card">
        <div
          className="cover-photo"
          style={{
            backgroundImage: coverImageUrl
              ? `url(${coverImageUrl})`
              : "linear-gradient(135deg, #22c1c3 0%, #fdbb2d 100%)",
            backgroundSize: "cover",
            backgroundPosition: `center ${coverPosition}%`,
          }}
        >
          {!coverImageUrl && (
            <p className="cover-placeholder">Add Cover Photo</p>
          )}

          <label htmlFor="cover-upload" className="cover-camera-btn">
            <Camera className="icon" />
          </label>

          <input
            type="file"
            id="cover-upload"
            accept="image/*"
            onChange={handleCoverUpload}
            style={{ display: "none" }}
          />

          {isAdjustingCover && (
            <div className="cover-adjust">
              <p className="cover-adjust-title">Adjust cover position</p>
              <input
                type="range"
                min="0"
                max="100"
                value={coverPosition}
                onChange={(e) => setCoverPosition(Number(e.target.value))}
              />

              <div className="adjust-buttons">
                <button className="adjustButton-save" onClick={handleSaveCover}>
                  Save
                </button>
                <button className="adjustButton-cancel" onClick={handleCancelCover}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="profile-header">
            <div className="profile-avatar-ring">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" className="profile-img" />
              ) : (
                <AccountCircleIcon className="profile-placeholder" />
              )}
            </div>

            <label
              htmlFor="profile-upload"
              className="camera-btn"
              aria-label="Upload profile photo"
            >
              <Camera className="icon" />
            </label>

            <input
              type="file"
              id="profile-upload"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
          </div>
        </div>

        <div className="profile-info">
          <div className="profile-identity">
            <h2 className="username">
              {name || "User Name"}

              {isVerifiedUser && (
                <VerifiedRoundedIcon className="verified-badge" />
              )}

              {isAdminUser && (
                <AdminPanelSettingsIcon className="admin-badge" />
              )}
            </h2>

            <p className="profession">{displaySkill || "No skill added yet"}</p>
          </div>

          <div className="verification-section">
            {renderVerificationButton()}
          </div>

          <div className="profile-status-grid">
            <div className="status-card">
              <span className="status-label">Role</span>
              <strong>{role === ROLE_VERIFIED ? "VERIFIED USER" : role}</strong>
            </div>

            <div className="status-card">
              <span className="status-label">Verification</span>
              <strong>{verificationStatus}</strong>
            </div>

            <div className="status-card">
              <span className="status-label">Posting Access</span>
              <strong>{postingAccessText}</strong>
            </div>
          </div>

          <div className="profile-meta-list">
            <div className="meta-row">
              <span>Father's Name</span>
              <strong>{fatherName || "N/A"}</strong>
            </div>

            <div className="meta-row">
              <span>Gender</span>
              <strong>{gender || "N/A"}</strong>
            </div>

            <div className="meta-row">
              <span>Date of Birth</span>
              <strong>{dob || "N/A"}</strong>
            </div>

            <div className="meta-row">
              <span>Age</span>
              <strong>{age ? `${age} years` : "N/A"}</strong>
            </div>
          </div>

          <div className="contact-info">
            <div className="contact-item">
              <Phone size={16} />
              <span>{phone || "No phone added"}</span>
            </div>

            <div className="contact-item">
              <Mail size={16} />
              <span>{email || "No email added"}</span>
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat-pill">
              <Users size={16} />
              <div>
                <strong>{formatFollowers(followers?.length || 0)}</strong>
                <span>Followers</span>
              </div>
            </div>

            <div className="stat-pill">
              <Heart size={16} />
              <div>
                <strong>{favorites?.length || 0}</strong>
                <span>Favorites</span>
              </div>
            </div>

            <div className="stat-pill" title={postingAccessText}>
              <ShieldCheck size={16} />
              <div>
                <strong>{postingAccessStat}</strong>
                <span>Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-inputs-container same-height-card">
        <h2 className="profile-heading">Edit Profile</h2>

        <div className="section">
          <h3 className="section-title">User Basic Info</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Father's Name</label>
              <input
                type="text"
                placeholder="Enter your father's name"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gender</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={gender === "Male"}
                    onChange={(e) => setGender(e.target.value)}
                  />
                  Male
                </label>

                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={gender === "Female"}
                    onChange={(e) => setGender(e.target.value)}
                  />
                  Female
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Skill</label>
              <select value={skill} onChange={handleSkillChange}>
                <option value="">Select skill</option>
                {SKILL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              {showOtherSkillInput && (
                <input
                  type="text"
                  placeholder="Please specify your skill"
                  className="mt-2"
                  value={otherSkill}
                  onChange={(e) => setOtherSkill(e.target.value)}
                />
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => handleDobChange(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Age</label>
              <input type="text" value={age} readOnly />
            </div>
          </div>
        </div>

        <div className="section">
          <h3 className="section-title">Contact Info</h3>

          <div className="form-grid">
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                placeholder="03453056959"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="example@email.com"
                value={email}
                disabled
              />
            </div>
          </div>
        </div>

        <div className="button-group update-group">
          <button className="btn update" onClick={updateDataHandler}>
            Update Profile
          </button>
        </div>

        <div className="section">
          <h3 className="section-title">Change Password</h3>

          <div className="form-grid password-grid">
            <div className="form-group password-group">
              <label>Old Password</label>
              <input
                type={showPassword.old ? "text" : "password"}
                placeholder="Enter old password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() =>
                  setShowPassword((prev) => ({
                    ...prev,
                    old: !prev.old,
                  }))
                }
              >
                {showPassword.old ? "Hide" : "Show"}
              </button>
            </div>

            <div className="form-group password-group">
              <label>New Password</label>
              <input
                type={showPassword.new ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() =>
                  setShowPassword((prev) => ({
                    ...prev,
                    new: !prev.new,
                  }))
                }
              >
                {showPassword.new ? "Hide" : "Show"}
              </button>
            </div>

            <div className="form-group password-group">
              <label>Confirm Password</label>
              <input
                type={showPassword.confirm ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() =>
                  setShowPassword((prev) => ({
                    ...prev,
                    confirm: !prev.confirm,
                  }))
                }
              >
                {showPassword.confirm ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        </div>

        <div className="button-group">
          <button className="btn update" onClick={changePasswordHandler}>
            Update Password
          </button>
        </div>
      </div>

      {isCropping && (
        <div className="cropper-modal">
          <div className="cropper-box">
            <div className="cropper-section">
              <Cropper
                image={previewUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="cropper-controls">
              <label className="range-label">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />

              {uploading && (
                <div className="upload-progress">
                  <p>Uploading... {uploadProgress}%</p>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="cropper-buttons">
                <button className="adjustButton-save" onClick={handleSaveCropped}>
                  Save
                </button>
                <button className="adjustButton-cancel" onClick={handleCancelCrop}>
                  Cancel
                </button>
              </div>

              {selectedFile && (
                <p className="selected-file-name">{selectedFile.name}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;