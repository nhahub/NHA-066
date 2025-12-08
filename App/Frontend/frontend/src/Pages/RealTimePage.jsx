import { useEffect } from "react";
import RealTime from "../Component/RealTime.jsx";
import { getToken } from "../HelperFunctions/token.js";
import { useNavigate } from "react-router-dom";

export default function RealTimePage() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!getToken()) navigate("/Auth");
  }, [navigate, getToken]);

  return (
    <div>
      <RealTime />
    </div>
  );
}
