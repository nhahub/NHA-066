import React, { useEffect } from "react";
import Gallery from "../Component/Gallery.jsx";
import { getToken } from "../HelperFunctions/token.js";
import { useNavigate } from "react-router-dom";

export default function GalleryPage() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!getToken()) navigate("/Auth");
  }, [navigate, getToken]);
  return (
    <div>
      <Gallery />
    </div>
  );
}
