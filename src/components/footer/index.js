import React from "react";
import "./index.css"; // import external CSS

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container-footer p-4 pb-0">
        <section className="mb-4 social-icons">
          <a className="btn btn-floating facebook" href="#!" role="button">
            <i className="fab fa-facebook-f"></i>
          </a>
          <a className="btn btn-floating twitter" href="#!" role="button">
            <i className="fab fa-twitter"></i>
          </a>
          <a className="btn btn-floating google" href="#!" role="button">
            <i className="fab fa-google"></i>
          </a>
          <a className="btn btn-floating instagram" href="#!" role="button">
            <i className="fab fa-instagram"></i>
          </a>
          <a className="btn btn-floating linkedin" href="#!" role="button">
            <i className="fab fa-linkedin-in"></i>
          </a>
          <a className="btn btn-floating github" href="#!" role="button">
            <i className="fab fa-github"></i>
          </a>
        </section>
      </div>

      <div className="footer-bottom">
        © 2025 Copyright: 
        <a className="text-white" href="https://dknewblog.com/"> dknewsblog.com</a>
      </div>
    </footer>
  );
}