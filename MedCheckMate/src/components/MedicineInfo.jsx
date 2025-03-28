import React, { useState } from 'react';
import './MedicineInfo.css';

const MedicineInfo = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [medicineData, setMedicineData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setMedicineData(null);

    try {
      const response = await fetch(`http://192.168.201.127:5000/api/medicine/${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Medicine not found');
      }

      const data = await response.json();
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }

      setMedicineData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="medicine-info">
      <div className="search-container">
        <h2>Search Medicine Information</h2>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter medicine name..."
            className="search-input"
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </form>
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Searching for medicine information...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {medicineData && medicineData.found_data && (
        <div className="medicine-details">
          <div className="medicine-header">
            <h3>{medicineData.medicine_name}</h3>
            <span className={`status ${medicineData.found_data ? 'safe' : 'unsafe'}`}>
              {medicineData.found_data ? 'Found' : 'Not Found'}
            </span>
          </div>

          <div className="medicine-grid">
            <div className="info-card">
              <h4>Used For</h4>
              <p>{medicineData.used_for}</p>
            </div>
            <div className="info-card">
              <h4>Medical Advice</h4>
              <p>{medicineData.medical_advice}</p>
            </div>
          </div>

          <div className="medicine-description">
            <h4>Safety Tips</h4>
            <p>{medicineData.safety_tips}</p>
          </div>

          {medicineData.disease && (
            <div className="medicine-description">
              <h4>Related Disease</h4>
              <p>{medicineData.disease}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicineInfo;
