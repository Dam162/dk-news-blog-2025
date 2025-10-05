// import React, { useRef, useState } from "react";
// import { Toast } from "primereact/toast";
// import { FileUpload } from "primereact/fileupload";
// import { ProgressBar } from "primereact/progressbar";
// import { Button } from "primereact/button";
// import { Tooltip } from "primereact/tooltip";
// import { Tag } from "primereact/tag";
// import "./index.css";

// export default function FileUploadTest() {
//   const toast = useRef(null);
//   const [totalSize, setTotalSize] = useState(0);
//   const fileUploadRef = useRef(null);

//   const onTemplateSelect = (e) => {
//     let _totalSize = totalSize;
//     let files = e.files;

//     Object.keys(files).forEach((key) => {
//       _totalSize += files[key].size || 0;
//     });

//     setTotalSize(_totalSize);
//   };

//   const onTemplateUpload = (e) => {
//     let _totalSize = 0;

//     e.files.forEach((file) => {
//       _totalSize += file.size || 0;
//     });

//     setTotalSize(_totalSize);
//     toast.current.show({
//       severity: "success",
//       summary: "Upload Successful",
//       detail: "Your files have been uploaded!",
//     });
//   };

//   const onTemplateRemove = (file, removeFile) => {
//     setTotalSize((prev) => prev - file.size);
//     removeFile();
//   };

//   const onTemplateClear = () => {
//     setTotalSize(0);
//   };

//   const headerTemplate = (options) => {
//     const { className, chooseButton, uploadButton, cancelButton } = options;
//     const value = totalSize / 10000;
//     const formatedValue = fileUploadRef.current?.formatSize(totalSize) || "0 B";

//     return (
//       <div className={className + " custom-header"}>
//         {chooseButton}
//         {uploadButton}
//         {cancelButton}
//         <div className="header-progress">
//           <span>{formatedValue} / 500 MB</span>
//           <ProgressBar
//             value={value}
//             showValue={false}
//             className="header-progress-bar"
//           />
//         </div>
//       </div>
//     );
//   };

//   const itemTemplate = (file, options) => {
//     const isVideo = file.type.startsWith("video/");

//     return (
//       <div className="file-item">
//         <div className="file-info">
//           <div className="file-preview-div">
//             {isVideo ? (
//               <video
//                 controls
//                 src={file.objectURL}
//                 className="file-preview"
//                 width="100"
//                 height="60"
//               />
//             ) : (
//               <img
//                 alt={file.name}
//                 role="presentation"
//                 src={file.objectURL}
//                 className="file-preview"
//               />
//             )}
//           </div>
//           <span className="file-name">
//             {file.name}
//             <small>{new Date().toLocaleDateString()}</small>
//           </span>
//         </div>
//         <Tag
//           value={options.formatSize}
//           severity="warning"
//           className="file-size"
//         />
//         <Button
//           type="button"
//           icon="pi pi-times"
//           className="p-button-rounded p-button-danger p-button-outlined remove-btn"
//           onClick={() => onTemplateRemove(file, options.onRemove)}
//         />
//       </div>
//     );
//   };

//   const emptyTemplate = () => {
//     return (
//       <div className="empty-drop">
//         <i className="pi pi-image upload-icon"></i>
//         <span className="upload-text">Drag & Drop Image Here</span>
//       </div>
//     );
//   };

//   const chooseOptions = {
//     icon: "pi pi-fw pi-images",
//     iconOnly: true,
//     className: "custom-choose-btn p-button-rounded p-button-outlined",
//   };
//   const uploadOptions = {
//     icon: "pi pi-fw pi-cloud-upload",
//     iconOnly: true,
//     className:
//       "custom-upload-btn p-button-success p-button-rounded p-button-outlined",
//   };
//   const cancelOptions = {
//     icon: "pi pi-fw pi-times",
//     iconOnly: true,
//     className:
//       "custom-cancel-btn p-button-danger p-button-rounded p-button-outlined",
//   };

//   return (
//     <div className="file-upload-wrapper">
//       <Toast ref={toast} />

//       {/* Tooltips */}
//       <Tooltip target=".custom-choose-btn" content="Choose" position="bottom" />
//       <Tooltip target=".custom-upload-btn" content="Upload" position="bottom" />
//       <Tooltip target=".custom-cancel-btn" content="Clear" position="bottom" />

//       <FileUpload
//         ref={fileUploadRef}
//         name="demo[]"
//         url="/api/upload"
//         multiple
//         accept=".jpg,.jpeg,.png,.gif,.mp4,.mov"
//         maxFileSize={524288000}
//         onUpload={onTemplateUpload}
//         onSelect={onTemplateSelect}
//         onError={onTemplateClear}
//         onClear={onTemplateClear}
//         headerTemplate={headerTemplate}
//         itemTemplate={itemTemplate}
//         emptyTemplate={emptyTemplate}
//         chooseOptions={chooseOptions}
//         uploadOptions={uploadOptions}
//         cancelOptions={cancelOptions}
//       />
//     </div>
//   );
// }
