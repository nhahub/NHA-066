import React, { useEffect } from "react";
import { getToken } from "../HelperFunctions/token.js";
import { useNavigate } from "react-router-dom";

export default function Redirect() {
  const navigate = useNavigate();

  useEffect(() => {
    if (getToken()) navigate("/Home");
    if (!getToken()) navigate("/Auth");
  }, [navigate, getToken]);
  return <div>Redirecting</div>;
}
