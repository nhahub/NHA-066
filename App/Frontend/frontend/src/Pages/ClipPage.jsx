import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { getToken } from "../HelperFunctions/token.js";
import { useNavigate } from "react-router-dom";
import Clip from "../Component/Clip.jsx";

export default function ClipPage() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!getToken()) navigate("/Auth");
  }, [navigate, getToken]);

  const { clip_id } = useParams();

  return (
    <div>
      <Clip video_Id={clip_id} />
    </div>
  );
}
