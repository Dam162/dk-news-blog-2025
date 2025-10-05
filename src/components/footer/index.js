import React from "react";
import "./index.css"; // import external CSS

export default function Footer() {
  return (
    <footer className="footer bg-dark text-center text-white">
      <div className="container-footer p-4 pb-0">
        <section className="mb-4 social-icons">
          <a className="btn btn-floating m-1 facebook" href="#!" role="button">
            <i className="fab fa-facebook-f"></i>
          </a>
          <a className="btn btn-floating m-1 twitter" href="#!" role="button">
            <i className="fab fa-twitter"></i>
          </a>
          <a className="btn btn-floating m-1 google" href="#!" role="button">
            <i className="fab fa-google"></i>
          </a>
          <a className="btn btn-floating m-1 instagram" href="#!" role="button">
            <i className="fab fa-instagram"></i>
          </a>
          <a className="btn btn-floating m-1 linkedin" href="#!" role="button">
            <i className="fab fa-linkedin-in"></i>
          </a>
          <a className="btn btn-floating m-1 github" href="#!" role="button">
            <i className="fab fa-github"></i>
          </a>
        </section>
      </div>

      <div className="footer-bottom text-center p-3">
        © 2025 Copyright:
        <a className="text-white" href="https://dknewblog.com/">
          {" "}dknewsblog.com
        </a>
      </div>
    </footer>
  );
}
