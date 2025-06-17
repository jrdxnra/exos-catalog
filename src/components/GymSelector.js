import React from 'react';
import PropTypes from 'prop-types';
import './GymSelector.css';

const GymSelector = ({ selectedGym, onGymChange }) => {
  const gyms = ['MP2', 'MAT3', 'MP5'];

  return (
    <div className="gym-selector">
      <h3>Select Gym</h3>
      <div className="gym-buttons">
        {gyms.map(gym => (
          <button
            key={gym}
            className={`gym-button ${selectedGym === gym ? 'active' : ''}`}
            onClick={() => onGymChange(gym)}
          >
            {gym}
          </button>
        ))}
      </div>
    </div>
  );
};

GymSelector.propTypes = {
  selectedGym: PropTypes.string,
  onGymChange: PropTypes.func.isRequired
};

export default GymSelector; 