import { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AuthPage from "./Pages/AuthPage";
import HomePage from "./Pages/HomePage.jsx";
import UploadPage from "./Pages/UploadPage.jsx";
import GalleryPage from "./Pages/GalleryPage.jsx";
import Redirect from "./Pages/Redirect.jsx";
import ClipPage from "./Pages/ClipPage.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Redirect />} />
        <Route path="/Auth" element={<AuthPage />} />
        <Route path="/Home" element={<HomePage />} />
        <Route path="/Upload" element={<UploadPage />} />
        <Route path="/Gallery" element={<GalleryPage />} />
        <Route path="/Clip/:clip_id" element={<ClipPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
