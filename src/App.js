import React, { useState } from "react";
import RouterConfig from "./router-config";
import firebase from "./firebase-config";
import "./App.css";

function App() {
  return (
    <div className="mainBody">
      <RouterConfig />
    </div>
  );
}

export default App;
