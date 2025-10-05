import React, { useEffect, useState, useCallback } from "react";
import { Camera, Phone, Mail, Facebook, Twitter, Linkedin } from "lucide-react";
import Cropper from "react-easy-crop";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import { toast } from "react-toastify";
import "./index.css";
import { ROLES } from "../../context/role";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { doc, onSnapshot, getFirestore, updateDoc } from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

const UserProfile = () => {
  // Firestore & Navigate
  const storage = getStorage();
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();

  // other
  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState("");
  const [skill, setSkill] = useState("");
  const [showOtherSkill, setShowOtherSkill] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [uid, setUid] = useState("");

  // for Password
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Add state for toggles
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  // for cover
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverPosition, setCoverPosition] = useState(50);
  const [isAdjustingCover, setIsAdjustingCover] = useState(false);
  const [pendingCoverFile, setPendingCoverFile] = useState(null);
  const [originalCover, setOriginalCover] = useState("");

  // for profile
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [originalProfile, setOriginalProfile] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [followers, setFollowers] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // 🔹 Cropper States
  const [isCropping, setIsCropping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // add these states
  const [role, setRole] = useState("user");
  const [appliedForVerified, setAppliedForVerified] = useState(false);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("user", user);
        if (user.emailVerified) {
          const userData = onSnapshot(
            doc(db, "users-dk-news-blog", user.uid),
            (userRes) => {
              console.log("Current data: ", userRes.data());
              setName(userRes.data().name);
              setEmail(userRes.data().email);
              setUid(user.uid);
              setPhone(userRes.data().phone);
              setFatherName(userRes.data().fatherName);
              setDob(userRes.data().dob);
              setAge(userRes.data().age);
              setGender(userRes.data().gender);
              setSkill(userRes.data().skill);
              setProfileImageUrl(userRes.data().profileImageUrl);
              setCoverImageUrl(userRes.data().coverImageUrl);
              setOriginalCover(userRes.data().coverImageUrl);
              setCoverPosition(userRes.data().coverPosition || 50);
              setRole(userRes.data().role || "user");
              setAppliedForVerified(userRes.data().appliedForVerified || false);
              setFollowers(userRes.data().followers || []);
              setFavorites(userRes.data().favorites || []);
            }
          );
          console.log("userData", userData);
        } else {
          navigate("/email-verify");
        }
      } else {
        navigate("/");
      }
    });
  }, []);
  // 🔹 Format followers count
  const formatFollowers = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num;
  };

  // 🔹 Firestore user (example, apke code me already uid set ho raha hai)
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUid(user.uid);
    }
  }, [auth]);

  // 🔹 Get cropped image from canvas
  const getCroppedImg = (imageSrc, crop) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext("2d");

        ctx.drawImage(
          image,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          crop.width,
          crop.height
        );

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }
          blob.name = "cropped.jpeg";
          const fileUrl = URL.createObjectURL(blob);
          resolve({ blob, fileUrl });
        }, "image/jpeg");
      };
      image.onerror = (error) => reject(error);
    });
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  useEffect(() => {
    const savedPos = localStorage.getItem("coverPosition");
    if (savedPos) {
      setCoverPosition(savedPos);
    }
  }, []);

  useEffect(() => {
    if (coverPosition) {
      localStorage.setItem("coverPosition", coverPosition);
    }
  }, [coverPosition]);

  const handleSkillChange = (e) => {
    setSkill(e.target.value);
    setShowOtherSkill(e.target.value === "Other");
  };

  const isProfileComplete = () => {
    return name && fatherName && dob && age && skill && gender && phone;
  };

  // ✅ handler for apply verified
  const handleApplyVerified = async () => {
    if (!isProfileComplete()) {
      toast.error("Please complete your profile before applying!");
      return;
    }
    const userRef = doc(db, "users-dk-news-blog", uid);
    await updateDoc(userRef, {
      appliedForVerified: true,
    });
    setAppliedForVerified(true);
    toast.success("Applied for Verified User! Wait for Admin approval.");
  };

  // Handlers

  const handleCoverUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);

      setCoverImageUrl(previewUrl); // show preview
      setPendingCoverFile(file);
      setIsAdjustingCover(true);
    }
  };

  // const handleImageUpload = (e) => {
  //   const file = e.target.files[0];
  //   console.log(file);
  //   const storageRef = ref(storage, `dk-newsBlog-profileImages/${uid}`);

  //   const uploadTask = uploadBytesResumable(storageRef, file);

  //   uploadTask.on(
  //     "state_changed",
  //     (snapshot) => {
  //       const progress =
  //         (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
  //       console.log("Upload is " + progress + "% done");
  //     },
  //     (error) => {
  //       console.log("uplaod error", error);
  //     },
  //     () => {
  //       getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
  //         console.log("File available at", downloadURL);
  //         setProfileImageUrl(downloadURL);
  //         // updating firestore data
  //         const userRef = doc(db, "users-dk-news-blog", uid);
  //         await updateDoc(userRef, {
  //           profileImageUrl: downloadURL,
  //         });
  //       });
  //     }
  //   );
  // };

  // 🔹 Handle File Select
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsCropping(true); // open modal
    }
  };
  // 🔹 Save Cropped
  const handleSaveCropped = async () => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const { blob, fileUrl } = await getCroppedImg(
        previewUrl,
        croppedAreaPixels
      );

      // Upload to Firebase
      const storageRef = ref(storage, `dk-newsBlog-profileImages/${uid}`);
      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress)); // update %
        },
        (error) => {
          console.error("Upload error", error);
          toast.error("Upload failed!");
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setProfileImageUrl(downloadURL);
          setOriginalProfile(downloadURL);

          // Update Firestore
          const userRef = doc(db, "users-dk-news-blog", uid);
          await updateDoc(userRef, { profileImageUrl: downloadURL });

          toast.success("Profile photo updated!");
          setIsCropping(false); // modal close
          setPreviewUrl(null);
          setSelectedFile(null);

          // reset progress
          setUploading(false);
          setUploadProgress(0);
        }
      );
    } catch (err) {
      console.error(err);
      toast.error("Crop failed!");
      setUploading(false);
    }
  };

  // 🔹 Cancel Cropping
  const handleCancelCrop = () => {
    setIsCropping(false);
    setPreviewUrl(null);
    setSelectedFile(null);
    setProfileImageUrl(originalProfile); // revert back
  };

  // updateDataHandler
  const updateDataHandler = async () => {
    console.log("clicked");

    if (!name) {
      toast.error("Name Required...!!!", {
        position: "top-right",
      });
    } else if (!fatherName) {
      toast.error("Father's Name Required...!!!", {
        position: "top-right",
      });
    } else if (!dob) {
      toast.error("Date of Birth Required...!!!", {
        position: "top-right",
      });
    } else if (!age) {
      toast.error("Age Required...!!!", {
        position: "top-right",
      });
    } else if (!skill) {
      toast.error("Skill Required...!!!", {
        position: "top-right",
      });
    } else if (!gender) {
      toast.error("Gender Required...!!!", {
        position: "top-right",
      });
    } else if (!phone) {
      toast.error("Phone Required...!!!", {
        position: "top-right",
      });
    } else {
      // All fields are valid, proceed with the update
      const updateUserData = doc(db, "users-dk-news-blog", uid);
      await updateDoc(updateUserData, {
        name,
        fatherName,
        phone,
        dob,
        age,
        skill: showOtherSkill ? showOtherSkill : skill,
        gender,
        followers,
        favorites,
      });
      toast.success("Profile updated successfully", { position: "top-right" });
    }
  };

  // changePasswordHandler
  const changePasswordHandler = async () => {
    // ✅ Password validation first
    // if (oldPassword || newPassword || confirmPassword) {
    if (!oldPassword) {
      toast.error("Old Password Required!", { position: "top-right" });
      return;
    }
    if (!newPassword) {
      toast.error("New Password Required!", { position: "top-right" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password must match!", {
        position: "top-right",
      });
      return;
    }

    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, oldPassword);

      // Re-authenticate user with old password
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
      toast.success("Password updated successfully", {
        position: "top-right",
      });

      // Clear fields
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Password update error", error);
      toast.error("Old password is incorrect!", { position: "top-right" });
      return;
    }
    // }
  };

  // Function to calculate age
  const handleDobChange = (value) => {
    setDob(value);
    if (value) {
      const today = new Date();
      const birthDate = new Date(value);
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        calculatedAge--;
      }
      setAge(calculatedAge);
    } else {
      setAge("");
    }
  };

  return (
    <div className="user-profile-wrapper">
      {/* Left: Profile Card */}
      <div className="profile-card">
        {/* Cover Photo */}

        <div
          className="cover-photo"
          style={{
            backgroundImage: coverImageUrl
              ? `url(${coverImageUrl})`
              : "linear-gradient(to right, rgba(34, 193, 195, 1) 10%, rgba(253, 187, 45, 1) 100%)",
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
              <input
                type="range"
                min="0"
                max="100"
                value={coverPosition}
                onChange={(e) => setCoverPosition(e.target.value)}
              />
              <div className="adjust-buttons">
                <button
                  className="adjustButton-save"
                  onClick={async () => {
                    if (pendingCoverFile) {
                      const storageRef = ref(
                        storage,
                        `dk-newsBlog-coverImages/${uid}`
                      );
                      const uploadTask = uploadBytesResumable(
                        storageRef,
                        pendingCoverFile
                      );

                      uploadTask.on(
                        "state_changed",
                        null,
                        (error) => console.log("upload error", error),
                        async () => {
                          const downloadURL = await getDownloadURL(
                            uploadTask.snapshot.ref
                          );
                          setCoverImageUrl(downloadURL);
                          setOriginalCover(downloadURL);
                          setPendingCoverFile(null);

                          const userRef = doc(db, "users-dk-news-blog", uid);
                          await updateDoc(userRef, {
                            coverImageUrl: downloadURL,
                            coverPosition,
                          });

                          toast.success("Cover photo updated", {
                            position: "top-right",
                          });
                          setIsAdjustingCover(false);
                        }
                      );
                    } else {
                      // Only position changed
                      const userRef = doc(db, "users-dk-news-blog", uid);
                      await updateDoc(userRef, { coverPosition });
                      toast.success("Cover position updated", {
                        position: "top-right",
                      });
                      setIsAdjustingCover(false);
                    }
                  }}
                >
                  Save
                </button>

                <button
                  className="adjustButton-cancel"
                  onClick={() => {
                    setCoverImageUrl(originalCover); // revert to last saved
                    setPendingCoverFile(null);
                    setIsAdjustingCover(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Profile Photo */}
          {/* <div className="profile-header">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt="Profile"
                className="profile-img"
              />
            ) : (
              <AccountCircleIcon className="profile-placeholder" />
            )}

            <label htmlFor="profile-upload" className="camera-btn">
              <Camera className="icon" />
            </label>
            <input
              type="file"
              id="profile-upload"
              accept="image/*"
              onChange={(e) => handleImageUpload(e)}
              style={{ display: "none" }}
            />
          </div> */}
          <div>
            {/* Profile Image Display */}
            <div className="profile-header">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt="Profile"
                  className="profile-img"
                />
              ) : (
                <AccountCircleIcon className="profile-placeholder" />
              )}

              <label htmlFor="profile-upload" className="camera-btn">
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

            {/* 🔹 Cropping Modal */}
            {isCropping && (
              <div className="cropper-modal">
                <div className="cropper-box">
                  {/* Cropper Section */}
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

                  {/* Controls Section */}
                  <div className="cropper-controls">
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(e.target.value)}
                    />
                    {uploading && (
                      <div className="upload-progress">
                        <p>Uploading... {uploadProgress}%</p>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="cropper-buttons">
                      <button
                        className="adjustButton-save"
                        onClick={handleSaveCropped}
                      >
                        Save
                      </button>
                      <button
                        className="adjustButton-cancel"
                        onClick={handleCancelCrop}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="profile-info">
          <div className="user-details">
            {/* <h2 className="username">
              {name}
              {role === ROLES.VERIFIED && (
                <VerifiedRoundedIcon
                  className="verified-badge"
                  style={{ color: "#1DA1F2" }}
                />
              )}
            </h2> */}
            <h2 className="username">
              {name}
              {role === ROLES.VERIFIED && (
                <VerifiedRoundedIcon
                  className="verified-badge"
                  style={{ color: "#1DA1F2" }}
                />
              )}
              {role === ROLES.ADMIN && (
                <AdminPanelSettingsIcon
                  className="admin-badge"
                  style={{ color: "#FF5733" }} // 🔹 orange/red for admin
                />
              )}
            </h2>

            <p className="profession">
              {showOtherSkill ? setShowOtherSkill : skill}
            </p>
          </div>
          {/* <div className="verification-section">
            {role === ROLES.USER && !appliedForVerified && (
              <button
                className="btn apply-btn"
                onClick={handleApplyVerified}
                disabled={!isProfileComplete()}
              >
                Apply for Verified User
              </button>
            )}

            {role === ROLES.USER && appliedForVerified && (
              <button className="btn applied-btn" disabled>
                Applied for Verification
              </button>
            )}

            {role === ROLES.VERIFIED && (
              <button className="btn verified-btn" disabled>
                Verified User ✅
              </button>
            )}
          </div> */}
          <div className="verification-section">
            {/* Normal User - Not applied yet */}
            {role === ROLES.USER && !appliedForVerified && (
              <button
                className="btn apply-btn"
                onClick={handleApplyVerified}
                disabled={!isProfileComplete()}
              >
                Apply for Verified User
              </button>
            )}

            {/* Normal User - Already applied */}
            {role === ROLES.USER && appliedForVerified && (
              <button className="btn applied-btn" disabled>
                Applied for Verification
              </button>
            )}

            {/* Verified User */}
            {role === ROLES.VERIFIED && (
              <button className="btn verified-btn" disabled>
                Verified User ✅
              </button>
            )}

            {/* Admin User */}
            {role === ROLES.ADMIN && (
              <button className="btn admin-btn" disabled>
                Admin 👑
              </button>
            )}
          </div>

          <div className="gender-details">
            <div className="gender">
              <span>Role : </span>
              <span>{role}</span>
            </div>
            <div className="gender">
              <span>Gender : </span>
              <span>{gender}</span>
            </div>
          </div>
          <div className="dob-age-details">
            <div className="dob-detail">
              <span>Father's Name : </span>
              <span>{fatherName}</span>
            </div>
            <div className="dob-detail">
              <span>DOB : </span>
              <span>{dob}</span>
            </div>
            <div className="dob-detail">
              <span>Age : </span>
              <span>{age} years</span>
            </div>
          </div>

          <div className="contact-info">
            <div className="contact-item">
              <i class="fa-solid fa-phone"></i>
              <span>{phone}</span>
            </div>
            <div className="contact-item">
              <i class="fa-solid fa-envelope"></i>
              <span>{email}</span>
            </div>
          </div>

          {/* Social Icons with Animation */}
          <div className="main">
            <div className="social">
              {/* <a
                href="https://twitter.com/yourprofile"
                className="fab fa-2x fa-twitter"
              ></a>
              <a
                href="https://medium.com/@yourprofile"
                className="fab fa-2x fa-facebook"
              ></a>
              <a
                href="https://www.instagram.com/yourprofile/"
                className="fab fa-2x fa-instagram"
              ></a>
              <a
                href="https://codepen.io/yourprofile"
                className="fab fa-2x fa-whatsapp"
              ></a> */}
              <b style={{ color: "white" }}>
                {formatFollowers(followers?.length || 0)}
              </b>
            </div>
            <div className="btn">
              <a href="#">FOLLOWERS</a>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Profile Form */}
      <div className="profile-inputs-container">
        <h2 className="profile-heading">Edit Profile</h2>

        {/* User Basic Info */}
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
                <option value="Web Designer">Web Designer</option>
                <option value="Web Developer">Web Developer</option>
                <option value="Data Analyst">Data Analyst</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="Graphic Designer">Graphic Designer</option>
                <option value="Resume Designer">Resume Designer</option>
                <option value="Software Engineer">Software Engineer</option>
                <option value="Teacher">Teacher</option>
                <option value="Other">Other</option>
              </select>
              {showOtherSkill && (
                <input
                  type="text"
                  placeholder="Please specify your skill"
                  className="mt-2"
                  value={showOtherSkill}
                  onChange={(e) => setShowOtherSkill(e.target.value)}
                />
              )}
            </div>
          </div>

          {/* DOB + Age */}
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

        {/* Contact Info */}
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
                onChange={(e) => setEmail(e.target.value)}
                disabled
              />
            </div>
          </div>
        </div>
        {/* Buttons */}
        <div className="button-group" id="button-group">
          {/* <button className="btn cancel">Cancel</button> */}
          {/* <button className="btn edit">Edit</button> */}
          <button className="btn update" onClick={updateDataHandler}>
            Update
          </button>
        </div>

        {/* Change Password */}
        <div className="section">
          <h3 className="section-title">Change Password</h3>
          <div className="form-grid">
            {/* Old Password */}
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
                  setShowPassword({ ...showPassword, old: !showPassword.old })
                }
              >
                {showPassword.old ? "Hide" : "Show"}
              </button>
            </div>

            {/* New Password */}
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
                  setShowPassword({ ...showPassword, new: !showPassword.new })
                }
              >
                {showPassword.new ? "Hide" : "Show"}
              </button>
            </div>

            {/* Confirm Password */}
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
                  setShowPassword({
                    ...showPassword,
                    confirm: !showPassword.confirm,
                  })
                }
              >
                {showPassword.confirm ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="button-group">
          {/* <button className="btn cancel">Cancel</button> */}
          {/* <button className="btn edit">Edit</button> */}
          <button className="btn update" onClick={changePasswordHandler}>
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
