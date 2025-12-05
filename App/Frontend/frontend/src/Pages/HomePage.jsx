import { useEffect } from "react";
import Home from "../Component/Home.jsx";
import { getToken } from "../HelperFunctions/token.js";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!getToken()) navigate("/Auth");
  }, [navigate, getToken]);

  return (
    <div>
      <Home />
    </div>
  );
}
