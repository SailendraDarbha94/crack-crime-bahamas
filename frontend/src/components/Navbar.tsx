"use client";
import React from "react";

const Navbar = () => {
  return (
    <>
      <style jsx>{`
        .sticky-navbar {
          position: fixed;
          width: 100%;
          top: 0;
          background-color: #333; /* Dark background */
          color: white;
          padding: 10px 20px;
          z-index: 1000;
        }
        .navbar-link {
            border-radius: 4px;
          color: white;
          padding: 8px 16px;
          text-decoration: none;
          display: inline-block;
        }
        .navbar-link:hover {
          background-color: #ddd;
          color: black;
        }
      `}</style>

      <div className="sticky-navbar">
        <a href="post" className="navbar-link">
          Home
        </a>
        <a href="auth" className="navbar-link">
          Admin
        </a>
        <a href="about" className="navbar-link">
          About
        </a>
      </div>
    </>
  );
};

export default Navbar;
