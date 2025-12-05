import { Upload, Camera, Image, LogOut } from "lucide-react";
import "./styles/Home.css";
import { useNavigate } from "react-router-dom";
import { removeToken } from "../HelperFunctions/token.js";

function Home() {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    navigate("/Auth");
  };

  const handleUpload = () => {
    navigate("/Upload");
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <header className="home-header">
          <div className="header-content">
            <h1 className="header-title">Anomaly Detection</h1>
            <button className="logout-button" onClick={handleLogout}>
              <LogOut size={20} />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        <div className="options-section">
          <div className="section-title">Choose an option to get started</div>

          <div className="options-grid">
            <div className="option-card">
              <div className="option-icon upload-icon">
                <Upload size={40} />
              </div>
              <h3>Upload Video</h3>
              <p>Upload a video file to analyze for anomalies</p>
              <button className="option-button" onClick={handleUpload}>
                Upload
              </button>
            </div>

            <div className="option-card">
              <div className="option-icon realtime-icon">
                <Camera size={40} />
              </div>
              <h3>Real-Time</h3>
              <p>Monitor live stream for anomalies in real-time</p>
              <button className="option-button">Start</button>
            </div>

            <div className="option-card">
              <div className="option-icon gallery-icon">
                <Image size={40} />
              </div>
              <h3>Gallery</h3>
              <p>Browse your detection history and saved results</p>
              <button className="option-button">View</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
