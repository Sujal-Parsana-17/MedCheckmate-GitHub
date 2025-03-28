import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-section">
      <h2>How MedCheckMate Works</h2>
      <p className="about-description">
        Our platform helps you verify and monitor medicine quality, ensuring you only use
        medications that are safe and effective.
      </p>
      
      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">🔍</div>
          <h3>Check Medicine</h3>
          <p>
            Easily search for any medicine in our database to verify its safety and potential side effects.
            Get detailed information about medicine quality parameters and safety status.
          </p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">🧪</div>
          <h3>Test Results</h3>
          <p>
            Access comprehensive test results including impurity levels, assay purity,
            dissolution rates, and storage conditions for each medicine.
          </p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Quality Monitoring</h3>
          <p>
            Track medicine quality parameters over time and stay informed about any
            changes in safety status or testing requirements.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⚕️</div>
          <h3>Healthcare Standards</h3>
          <p>
            All tests are conducted following international healthcare standards
            to ensure accurate and reliable results.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
