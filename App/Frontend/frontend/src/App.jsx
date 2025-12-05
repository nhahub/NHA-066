import { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AuthPage from "./Pages/AuthPage";
import HomePage from "./Pages/HomePage.jsx";
import UploadPage from "./Pages/UploadPage.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/Auth" element={<AuthPage />} />
        <Route path="/Home" element={<HomePage />} />
        <Route path="/Upload" element={<UploadPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
