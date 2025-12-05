import Upload from "../Component/Upload.jsx";
import { getToken } from "../HelperFunctions/token.js";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function UploadPage() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!getToken()) navigate("/Auth");
  }, [navigate, getToken]);

  return (
    <div>
      <Upload />
    </div>
  );
}
