import React from 'react';
import NotificationSettings from './NotificationSettings';

const NotificationManager = ({ isVisible, onClose }) => {



  if (!isVisible) return null;

  return (
    <div className="notification-manager-overlay">
      <div className="notification-manager-modal">
        <div className="notification-manager-header">
          <h3>⚙️ Notification Settings</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="notification-manager-content">
          <NotificationSettings 
            isVisible={true}
            onClose={() => {}} // Empty function since we're embedding it
            embedded={true} // New prop to indicate it's embedded
          />
        </div>


        

      </div>

              <style>{`
        .notification-manager-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .notification-manager-modal {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 800px;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .notification-manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e9ecef;
          background: #f8f9fa;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .settings-btn {
          padding: 6px 10px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .settings-btn:hover {
          background: #0056b3;
        }

        .notification-manager-header h3 {
          margin: 0;
          color: #333;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }

        .close-btn:hover {
          color: #333;
        }

        .notification-manager-content {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
          background: white;
        }

        /* Inherit all the notification settings styles */
        .notification-manager-content .settings-tabs {
          display: flex;
          gap: 0;
          margin-bottom: 24px;
          border-bottom: 2px solid #e9ecef;
        }

        .notification-manager-content .settings-tab {
          padding: 12px 20px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #666;
          transition: all 0.2s ease;
          margin-bottom: -2px;
        }

        .notification-manager-content .settings-tab:hover {
          color: #007bff;
          background: #f8f9fa;
        }

        .notification-manager-content .settings-tab.active {
          color: #007bff;
          border-bottom-color: #007bff;
          background: white;
        }

        .notification-manager-content .settings-section {
          margin-bottom: 32px;
        }

        .notification-manager-content .settings-section h4 {
          margin: 0 0 16px 0;
          color: #333;
          font-size: 16px;
          font-weight: 600;
        }

        .notification-manager-content .setting-group {
          margin-bottom: 16px;
        }

        .notification-manager-content .setting-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #333;
          margin-bottom: 6px;
          cursor: pointer;
        }

        .notification-manager-content .setting-label input[type="checkbox"] {
          margin: 0;
        }

        .notification-manager-content .setting-input,
        .notification-manager-content .setting-textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }

        .notification-manager-content .setting-input:focus,
        .notification-manager-content .setting-textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        .notification-manager-content .template-variables {
          margin-top: 16px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .notification-manager-content .template-variables h5 {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: #555;
        }

        .notification-manager-content .variable-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .notification-manager-content .variable {
          background: #e9ecef;
          color: #495057;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-family: monospace;
        }

        .notification-manager-content .preview-section {
          margin-top: 32px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .notification-manager-content .preview-section h4 {
          margin: 0 0 16px 0;
          color: #333;
          font-size: 16px;
          font-weight: 600;
        }

        .notification-manager-content .preview-controls {
          margin-bottom: 16px;
        }

        .notification-manager-content .preview-data h5 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #555;
        }

        .notification-manager-content .preview-inputs {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .notification-manager-content .preview-input {
          flex: 1;
          padding: 6px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 12px;
        }

        .notification-manager-content .preview-result h5 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #555;
        }

        .notification-manager-content .preview-content {
          background: white;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 12px;
          white-space: pre-wrap;
          max-height: 200px;
          overflow-y: auto;
          margin: 0;
        }

        .notification-manager-content .settings-footer {
          margin-top: 24px;
          padding: 16px 0;
          border-top: 1px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: transparent;
        }

        .notification-manager-content .reset-btn {
          padding: 8px 16px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s ease;
        }

        .notification-manager-content .reset-btn:hover {
          background: #5a6268;
        }

        .notification-manager-content .save-buttons {
          display: flex;
          gap: 8px;
        }

        .notification-manager-content .save-btn {
          padding: 8px 16px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s ease;
        }

        .notification-manager-content .save-btn:hover {
          background: #218838;
        }
      `}</style>
    </div>
  );
};

export default NotificationManager; 