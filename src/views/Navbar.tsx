import { FC, useState } from "react";
import { FaGithub } from "react-icons/fa";
import { FaBars, FaTimes } from "react-icons/fa";

interface NavbarProps {
  activeTab: "speakers" | "descriptions" | "about";
  onTabChange: (tab: "speakers" | "descriptions" | "about") => void;
}

const Navbar: FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleTabChange = (tab: "speakers" | "descriptions" | "about") => {
    onTabChange(tab);
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <a href="#speakers" className="navbar-title">
          <h1>NICAR Network</h1>
        </a>
        <div className="navbar-tabs">
          <button
            className={`navbar-tab ${activeTab === "speakers" ? "active" : ""}`}
            onClick={() => onTabChange("speakers")}
          >
            Speakers
          </button>
          <button
            className={`navbar-tab ${activeTab === "descriptions" ? "active" : ""}`}
            onClick={() => onTabChange("descriptions")}
          >
            Descriptions
          </button>
          <button
            className={`navbar-tab ${activeTab === "about" ? "active" : ""}`}
            onClick={() => onTabChange("about")}
          >
            About
          </button>
        </div>
      </div>
      <div className="navbar-right">
        <a
          href="https://github.com/trislee/nicar-network"
          target="_blank"
          rel="noopener noreferrer"
          className="navbar-github"
          title="View on GitHub"
        >
          <FaGithub />
        </a>
      </div>
      <button
        className="navbar-hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        {menuOpen ? <FaTimes /> : <FaBars />}
      </button>
      <div className={`navbar-mobile-menu ${menuOpen ? "open" : ""}`}>
        <button
          className={`navbar-mobile-tab ${activeTab === "speakers" ? "active" : ""}`}
          onClick={() => handleTabChange("speakers")}
        >
          Speakers
        </button>
        <button
          className={`navbar-mobile-tab ${activeTab === "descriptions" ? "active" : ""}`}
          onClick={() => handleTabChange("descriptions")}
        >
          Descriptions
        </button>
        <button
          className={`navbar-mobile-tab ${activeTab === "about" ? "active" : ""}`}
          onClick={() => handleTabChange("about")}
        >
          About
        </button>
        <a
          href="https://github.com/trislee/nicar-network"
          target="_blank"
          rel="noopener noreferrer"
          className="navbar-mobile-github"
          onClick={() => setMenuOpen(false)}
        >
          <FaGithub /> GitHub
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
