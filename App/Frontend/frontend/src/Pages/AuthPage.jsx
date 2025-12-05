import React, { useEffect } from "react";
import Auth from "../Component/Auth.jsx";
import { getToken } from "../HelperFunctions/token.js";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (getToken()) navigate("/Home");
  }, [navigate, getToken]);

  return <Auth />;
}
