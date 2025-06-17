import React from 'react';
import PropTypes from 'prop-types';

function GymTabs({ activeGym, onGymChange, gyms }) {
  return (
    <div className="gym-tabs">
      {gyms.map((gym) => (
        <button
          key={gym}
          className={`gym-tab ${activeGym === gym ? 'active' : ''}`}
          onClick={() => onGymChange(gym)}
        >
          {gym}
        </button>
      ))}
    </div>
  );
}

GymTabs.propTypes = {
  activeGym: PropTypes.string.isRequired,
  onGymChange: PropTypes.func.isRequired,
  gyms: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default GymTabs; 