import React, { useState } from 'react';
import './MedicineSafetyTest.css';

const MedicineSafetyTest = () => {
  const [formData, setFormData] = useState({
    assayPurity: '',
    daysUntilExpiry: '',
    dissolutionRate: '',
    impurityLevel: '',
    storageTemperature: ''
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const response = await fetch('http://192.168.201.127:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          "Active Ingredient" : formData.medicineName,
          "Assay Purity (%)": parseFloat(formData.assayPurity),
          "Days Until Expiry": parseInt(formData.daysUntilExpiry),
          "Dissolution Rate (%)": parseFloat(formData.dissolutionRate),
          "Impurity Level (%)": parseFloat(formData.impurityLevel),
          "Storage Temperature (°C)": parseFloat(formData.storageTemperature)
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get prediction');
      }

      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="medicine-safety-test">
      <h2>Test Medicine Safety</h2>
      <form onSubmit={handleSubmit} className="safety-test-form">

      <div className="form-group">
          {/* <label htmlFor="medicineName">Medicine Name</label> */}
          <input
            type="string"
            id="medicineName"
            name="medicineName"
            value={formData.medicineName}
            onChange={handleInputChange}
            required
            
            placeholder="Enter Medicine name"
          />
        </div>

        <div className="form-group">
          {/* <label htmlFor="assayPurity">Assay Purity (%)</label> */}
          <input
            type="number"
            id="assayPurity"
            name="assayPurity"
            value={formData.assayPurity}
            onChange={handleInputChange}
            required
            step="0.1"
            min="0"
            max="100"
            placeholder="Enter assay purity percentage"
          />
        </div>

        <div className="form-group">
          {/* <label htmlFor="daysUntilExpiry">Days Until Expiry</label> */}
          <input
            type="number"
            id="daysUntilExpiry"
            name="daysUntilExpiry"
            value={formData.daysUntilExpiry}
            onChange={handleInputChange}
            required
            min="0"
            placeholder="Enter number of days until expiry"
          />
        </div>

        <div className="form-group">
          {/* <label htmlFor="dissolutionRate">Dissolution Rate (%)</label> */}
          <input
            type="number"
            id="dissolutionRate"
            name="dissolutionRate"
            value={formData.dissolutionRate}
            onChange={handleInputChange}
            required
            step="0.1"
            min="0"
            max="100"
            placeholder="Enter dissolution rate percentage"
          />
        </div>

        <div className="form-group">
          {/* <label htmlFor="impurityLevel">Impurity Level (%)</label> */}
          <input
            type="number"
            id="impurityLevel"
            name="impurityLevel"
            value={formData.impurityLevel}
            onChange={handleInputChange}
            required
            step="0.1"
            min="0"
            max="100"
            placeholder="Enter impurity level percentage"
          />
        </div>

        <div className="form-group">
          {/* <label htmlFor="storageTemperature">Storage Temperature (°C)</label> */}
          <input
            type="number"
            id="storageTemperature"
            name="storageTemperature"
            value={formData.storageTemperature}
            onChange={handleInputChange}
            required
            step="0.1"
            placeholder="Enter storage temperature"
          />
        </div>

       

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Testing...' : 'Test Medicine'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {prediction && (
        <div className="prediction-result">
          <h3>Test Results</h3>
          <div className={`prediction-status ${prediction.prediction.toLowerCase()}`}>
            {prediction.prediction}
          </div>
          
          <div className="confidence-info">
            <h4>Confidence Level</h4>
            <div className="confidence-bar">
              <div 
                className="confidence-fill"
                style={{ width: `${prediction.confidence[0] * 100}%` }}
              >
                {(prediction.confidence[0] * 100).toFixed(2)}%
              </div>
            </div>
          </div>

          <div className="features-received">
            <h4>Test Parameters</h4>
            <div className="features-grid">
              {Object.entries(prediction.features_received).map(([key, value]) => (
                <div key={key} className="feature-item">
                  <span className="feature-label">{key}</span>
                  <span className="feature-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineSafetyTest;
