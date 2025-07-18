import React, { useState, useEffect } from 'react';
import CONFIG from '../config';
import './NotificationSettings.css';

// Debug: Check if config is imported correctly
console.log('NotificationSettings - Imported CONFIG:', CONFIG);
console.log('NotificationSettings - CONFIG.APP:', CONFIG?.APP);
console.log('NotificationSettings - CONFIG.APP.GYMS:', CONFIG?.APP?.GYMS);

const NotificationSettings = ({ isVisible, onClose, embedded = false }) => {
  // Debug: Check if gyms are loaded
  console.log('NotificationSettings - CONFIG.APP.GYMS:', CONFIG.APP.GYMS);
  console.log('NotificationSettings - CONFIG:', CONFIG);
  
  // Fallback gyms in case config is not loaded
  const fallbackGyms = ['MP2', 'MAT3', 'MP5', 'HMBLT', 'CRSM', 'TM3', 'MPD237'];
  const gymsToUse = CONFIG?.APP?.GYMS || fallbackGyms;
  
  const [settings, setSettings] = useState({
    enabled: CONFIG.NOTIFICATIONS.ENABLED,
    requireApproval: CONFIG.NOTIFICATIONS.REVIEW.REQUIRE_APPROVAL,
    autoSend: CONFIG.NOTIFICATIONS.REVIEW.AUTO_SEND,
    emailProvider: CONFIG.NOTIFICATIONS.EMAIL_SERVICE.PROVIDER,
    fromEmail: CONFIG.NOTIFICATIONS.EMAIL_SERVICE.FROM_EMAIL,
    fromName: CONFIG.NOTIFICATIONS.EMAIL_SERVICE.FROM_NAME,
    apiKey: CONFIG.NOTIFICATIONS.EMAIL_SERVICE.API_KEY,
    autoNotifyManagers: CONFIG.APPROVAL_WORKFLOW?.AUTO_NOTIFY_MANAGERS || true,
    allowManagerNotes: CONFIG.APPROVAL_WORKFLOW?.ALLOW_MANAGER_NOTES || true,
    approvalTimeoutDays: CONFIG.APPROVAL_WORKFLOW?.APPROVAL_TIMEOUT ? Math.floor(CONFIG.APPROVAL_WORKFLOW.APPROVAL_TIMEOUT / (24 * 60 * 60 * 1000)) : 7,
    performanceManagers: CONFIG.GYM_MANAGERS?.PERFORMANCE_MANAGERS || {},
    operationsManagers: CONFIG.GYM_MANAGERS?.OPERATIONS_MANAGERS || {},
  });

  const [templates, setTemplates] = useState({
    tag: {
      enabled: CONFIG.NOTIFICATIONS.TYPES.TAG.ENABLED,
      subject: CONFIG.NOTIFICATIONS.TYPES.TAG.SUBJECT,
      template: CONFIG.NOTIFICATIONS.TYPES.TAG.TEMPLATE
    },
    approval: {
      enabled: CONFIG.NOTIFICATIONS.TYPES.APPROVAL.ENABLED,
      subject: CONFIG.NOTIFICATIONS.TYPES.APPROVAL.SUBJECT,
      template: CONFIG.NOTIFICATIONS.TYPES.APPROVAL.TEMPLATE
    },
    pmApproval: {
      enabled: true,
      subject: 'Gym Equipment Request - Performance Manager Approval Required',
      template: `Dear {managerName},

A gym equipment request requires your approval as Performance Manager.

**Request Details:**
- Gym: {gymName}
- Item: {itemName}
- Requested by: {requesterName}
- Quantity: {quantity}
- Total Cost: {totalCost}

**Justification:**
{justification}

**Notes:**
{notes}

**Action Required:**
Please review and approve/reject this request. You can add notes during approval.

**Direct Link:**
{approvalLink}

Best regards,
Gym Equipment Management System`
    },
    omApproval: {
      enabled: true,
      subject: 'Gym Equipment Request - Operations Manager Final Approval',
      template: `Dear {managerName},

A gym equipment request requires your final approval as Operations Manager.

**Request Details:**
- Gym: {gymName}
- Item: {itemName}
- Requested by: {requesterName}
- Quantity: {quantity}
- Total Cost: {totalCost}

**Justification:**
{justification}

**Notes:**
{notes}

**PM Approval Notes:**
{pmNotes}

**Action Required:**
Please review and provide final approval/rejection. You can add notes during approval.

**Direct Link:**
{approvalLink}

Best regards,
Gym Equipment Management System`
    }
  });

  const [activeTab, setActiveTab] = useState('general');
  const [previewData, setPreviewData] = useState({
    userName: 'John Smith',
    taggerName: 'Sarah Johnson',
    managerName: 'John Smith',
    gymName: 'MP2',
    itemName: 'Dumbbell Set',
    itemBrand: 'PowerBlock',
    partNumber: 'DB-001',
    itemStatus: 'Pending Approval',
    requesterName: 'Sarah Johnson',
    quantity: '2',
    totalCost: '$599.98',
    justification: 'Program Needs - New strength training program',
    notes: 'We need these for the new strength training program starting next month.',
    noteText: 'Please review this request for the new strength training program.',
    pmNotes: 'Approved - Good justification for program needs',
    omNotes: 'Final approval granted - Budget approved',
    appLink: 'https://example.com/my-react-app/?gym=MP2&item=Dumbbell%20Set',
    approvalLink: 'https://example.com/my-react-app/approval?token=abc123'
  });

  const [previewResult, setPreviewResult] = useState('');

  // Process template with preview data
  const processTemplate = (template, variables) => {
    let processedTemplate = template;
    Object.keys(variables).forEach(key => {
      const placeholder = `{${key}}`;
      const value = variables[key] || '';
      processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), value);
    });
    return processedTemplate;
  };

  // Update preview when template or data changes
  useEffect(() => {
    let currentTemplate = '';
    if (activeTab === 'approval') {
      // Show PM template by default, but could be toggled
      currentTemplate = templates.pmApproval.template;
    } else if (activeTab === 'general') {
      // Show approval template for general tab
      currentTemplate = templates.approval.template;
    }
    const result = processTemplate(currentTemplate, previewData);
    setPreviewResult(result);
  }, [templates, previewData, activeTab]);

  const handleSave = () => {
    // In a real app, this would save to a backend or localStorage
    console.log('Saving notification settings:', { settings, templates });
    
    // Show success message
    const message = document.createElement('div');
    message.textContent = '✅ Settings saved successfully!';
    message.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 3000);
  };

  const handleReset = () => {
    setSettings({
      enabled: CONFIG.NOTIFICATIONS.ENABLED,
      requireApproval: CONFIG.NOTIFICATIONS.REVIEW.REQUIRE_APPROVAL,
      autoSend: CONFIG.NOTIFICATIONS.REVIEW.AUTO_SEND,
      emailProvider: CONFIG.NOTIFICATIONS.EMAIL_SERVICE.PROVIDER,
      fromEmail: CONFIG.NOTIFICATIONS.EMAIL_SERVICE.FROM_EMAIL,
      fromName: CONFIG.NOTIFICATIONS.EMAIL_SERVICE.FROM_NAME,
      apiKey: CONFIG.NOTIFICATIONS.EMAIL_SERVICE.API_KEY,
      autoNotifyManagers: CONFIG.APPROVAL_WORKFLOW?.AUTO_NOTIFY_MANAGERS || true,
      allowManagerNotes: CONFIG.APPROVAL_WORKFLOW?.ALLOW_MANAGER_NOTES || true,
      approvalTimeoutDays: CONFIG.APPROVAL_WORKFLOW?.APPROVAL_TIMEOUT ? Math.floor(CONFIG.APPROVAL_WORKFLOW.APPROVAL_TIMEOUT / (24 * 60 * 60 * 1000)) : 7,
      performanceManagers: CONFIG.GYM_MANAGERS?.PERFORMANCE_MANAGERS || {},
      operationsManagers: CONFIG.GYM_MANAGERS?.OPERATIONS_MANAGERS || {},
    });
    
    setTemplates({
      tag: {
        enabled: CONFIG.NOTIFICATIONS.TYPES.TAG.ENABLED,
        subject: CONFIG.NOTIFICATIONS.TYPES.TAG.SUBJECT,
        template: CONFIG.NOTIFICATIONS.TYPES.TAG.TEMPLATE
      },
      approval: {
        enabled: CONFIG.NOTIFICATIONS.TYPES.APPROVAL.ENABLED,
        subject: CONFIG.NOTIFICATIONS.TYPES.APPROVAL.SUBJECT,
        template: CONFIG.NOTIFICATIONS.TYPES.APPROVAL.TEMPLATE
      },
      pmApproval: {
        enabled: true,
        subject: 'Gym Equipment Request - Performance Manager Approval Required',
        template: `Dear {managerName},

A gym equipment request requires your approval as Performance Manager.

**Request Details:**
- Gym: {gymName}
- Item: {itemName}
- Requested by: {requesterName}
- Quantity: {quantity}
- Total Cost: {totalCost}

**Justification:**
{justification}

**Notes:**
{notes}

**Action Required:**
Please review and approve/reject this request. You can add notes during approval.

**Direct Link:**
{approvalLink}

Best regards,
Gym Equipment Management System`
      },
      omApproval: {
        enabled: true,
        subject: 'Gym Equipment Request - Operations Manager Final Approval',
        template: `Dear {managerName},

A gym equipment request requires your final approval as Operations Manager.

**Request Details:**
- Gym: {gymName}
- Item: {itemName}
- Requested by: {requesterName}
- Quantity: {quantity}
- Total Cost: {totalCost}

**Justification:**
{justification}

**Notes:**
{notes}

**PM Approval Notes:**
{pmNotes}

**Action Required:**
Please review and provide final approval/rejection. You can add notes during approval.

**Direct Link:**
{approvalLink}

Best regards,
Gym Equipment Management System`
      }
    });
  };

  if (!isVisible) return null;

  // If embedded, just return the content without the modal wrapper
  if (embedded) {
    return (
      <div className="notification-settings-embedded">
        {/* Tab Navigation */}
        <div className="settings-tabs">
          <button 
            className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button 
            className={`settings-tab ${activeTab === 'approval' ? 'active' : ''}`}
            onClick={() => setActiveTab('approval')}
          >
            Approval Workflow
          </button>
          <button 
            className={`settings-tab ${activeTab === 'managers' ? 'active' : ''}`}
            onClick={() => setActiveTab('managers')}
          >
            Managers
          </button>
        </div>

        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="settings-section">
            <h4>General Configuration</h4>
            
            <div className="setting-group">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                />
                Enable Notifications
              </label>
            </div>

            <div className="setting-group">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={settings.requireApproval}
                  onChange={(e) => setSettings(prev => ({ ...prev, requireApproval: e.target.checked }))}
                />
                Require Approval Before Sending
              </label>
            </div>

            <div className="setting-group">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={settings.autoSend}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoSend: e.target.checked }))}
                />
                Auto-send After Approval
              </label>
            </div>

            <div className="setting-group">
              <label className="setting-label">Email Provider</label>
              <select
                value={settings.emailProvider}
                onChange={(e) => setSettings(prev => ({ ...prev, emailProvider: e.target.value }))}
                className="setting-input"
              >
                <option value="sendgrid">SendGrid</option>
                <option value="mailgun">Mailgun</option>
                <option value="smtp">SMTP</option>
              </select>
            </div>

            <div className="setting-group">
              <label className="setting-label">From Email</label>
              <input
                type="email"
                value={settings.fromEmail}
                onChange={(e) => setSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                className="setting-input"
              />
            </div>

            <div className="setting-group">
              <label className="setting-label">From Name</label>
              <input
                type="text"
                value={settings.fromName}
                onChange={(e) => setSettings(prev => ({ ...prev, fromName: e.target.value }))}
                className="setting-input"
              />
            </div>

            <div className="setting-group">
              <label className="setting-label">API Key</label>
              <input
                type="password"
                value={settings.apiKey}
                onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                className="setting-input"
                placeholder="Enter your API key"
              />
            </div>
          </div>
        )}

        {/* Manager Configuration */}
        {activeTab === 'managers' && (
          <div className="settings-section">
            <h4>Gym Manager Configuration</h4>
            
            <div className="setting-group">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={settings.autoNotifyManagers}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoNotifyManagers: e.target.checked }))}
                />
                Auto-notify managers when items are added
              </label>
            </div>

            <div className="setting-group">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={settings.allowManagerNotes}
                  onChange={(e) => setSettings(prev => ({ ...prev, allowManagerNotes: e.target.checked }))}
                />
                Allow managers to add notes during approval
              </label>
            </div>

            <div className="setting-group">
              <label className="setting-label">Approval Timeout (days)</label>
              <input
                type="number"
                value={settings.approvalTimeoutDays}
                onChange={(e) => setSettings(prev => ({ ...prev, approvalTimeoutDays: parseInt(e.target.value) || 7 }))}
                className="setting-input"
                min="1"
                max="30"
              />
            </div>

            <div className="manager-section">
              <table className="manager-table">
                <thead>
                  <tr>
                    <th>Gym</th>
                    <th>Performance Manager (PM)</th>
                    <th>Operations Manager (OM)</th>
                  </tr>
                </thead>
                <tbody>
                  {gymsToUse && gymsToUse.length > 0 ? (
                    gymsToUse.map((gym, index) => (
                      <tr key={gym} className={`gym-row ${index % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                      <td className="gym-cell">{gym}</td>
                      <td className="pm-cell">
                        <input
                          type="text"
                          value={settings.performanceManagers[gym]?.name || ''}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            performanceManagers: {
                              ...prev.performanceManagers,
                              [gym]: { ...prev.performanceManagers[gym], name: e.target.value }
                            }
                          }))}
                          placeholder="Name"
                          className="table-input"
                        />
                        <input
                          type="email"
                          value={settings.performanceManagers[gym]?.email || ''}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            performanceManagers: {
                              ...prev.performanceManagers,
                              [gym]: { ...prev.performanceManagers[gym], email: e.target.value }
                            }
                          }))}
                          placeholder="Email"
                          className="table-input"
                        />
                      </td>
                      <td className="om-cell">
                        <input
                          type="text"
                          value={settings.operationsManagers[gym]?.name || ''}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            operationsManagers: {
                              ...prev.operationsManagers,
                              [gym]: { ...prev.operationsManagers[gym], name: e.target.value }
                            }
                          }))}
                          placeholder="Name"
                          className="table-input"
                        />
                        <input
                          type="email"
                          value={settings.operationsManagers[gym]?.email || ''}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            operationsManagers: {
                              ...prev.operationsManagers,
                              [gym]: { ...prev.operationsManagers[gym], email: e.target.value }
                            }
                          }))}
                          placeholder="Email"
                          className="table-input"
                        />
                      </td>
                    </tr>
                  ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        No gyms found in configuration. Please check CONFIG.APP.GYMS.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Approval Workflow Settings */}
        {activeTab === 'approval' && (
          <div className="settings-section">
            <h4>Approval Workflow Configuration</h4>
            
            <div className="setting-group">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={templates.pmApproval.enabled}
                  onChange={(e) => setTemplates(prev => ({ 
                    ...prev, 
                    pmApproval: { ...prev.pmApproval, enabled: e.target.checked }
                  }))}
                />
                Enable PM Approval Notifications
              </label>
            </div>

            <div className="setting-group">
              <label className="setting-label">PM Approval Email Subject</label>
              <input
                type="text"
                value={templates.pmApproval.subject}
                onChange={(e) => setTemplates(prev => ({ 
                  ...prev, 
                  pmApproval: { ...prev.pmApproval, subject: e.target.value }
                }))}
                className="setting-input"
              />
            </div>

            <div className="setting-group">
              <label className="setting-label">PM Approval Email Template</label>
              <textarea
                value={templates.pmApproval.template}
                onChange={(e) => setTemplates(prev => ({ 
                  ...prev, 
                  pmApproval: { ...prev.pmApproval, template: e.target.value }
                }))}
                className="setting-textarea"
                rows="15"
                placeholder="Enter your PM approval email template..."
              />
            </div>

            <div className="setting-group">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={templates.omApproval.enabled}
                  onChange={(e) => setTemplates(prev => ({ 
                    ...prev, 
                    omApproval: { ...prev.omApproval, enabled: e.target.checked }
                  }))}
                />
                Enable OM Approval Notifications
              </label>
            </div>

            <div className="setting-group">
              <label className="setting-label">OM Approval Email Subject</label>
              <input
                type="text"
                value={templates.omApproval.subject}
                onChange={(e) => setTemplates(prev => ({ 
                  ...prev, 
                  omApproval: { ...prev.omApproval, subject: e.target.value }
                }))}
                className="setting-input"
              />
            </div>

            <div className="setting-group">
              <label className="setting-label">OM Approval Email Template</label>
              <textarea
                value={templates.omApproval.template}
                onChange={(e) => setTemplates(prev => ({ 
                  ...prev, 
                  omApproval: { ...prev.omApproval, template: e.target.value }
                }))}
                className="setting-textarea"
                rows="15"
                placeholder="Enter your OM approval email template..."
              />
            </div>

            <div className="template-variables">
              <h5>Available Variables:</h5>
              <div className="variable-list">
                <span className="variable">&#123;managerName&#125;</span>
                <span className="variable">&#123;gymName&#125;</span>
                <span className="variable">&#123;itemName&#125;</span>
                <span className="variable">&#123;requesterName&#125;</span>
                <span className="variable">&#123;quantity&#125;</span>
                <span className="variable">&#123;totalCost&#125;</span>
                <span className="variable">&#123;justification&#125;</span>
                <span className="variable">&#123;notes&#125;</span>
                <span className="variable">&#123;pmNotes&#125;</span>
                <span className="variable">&#123;omNotes&#125;</span>
                <span className="variable">&#123;appLink&#125;</span>
                <span className="variable">&#123;approvalLink&#125;</span>
              </div>
            </div>
          </div>
        )}

        {/* Preview Section - Only show for non-manager tabs */}
        {activeTab !== 'managers' && (
          <div className="preview-section">
            <h4>📧 Email Preview</h4>
            <div className="preview-controls">
              <div className="preview-data">
                <h5>Preview Data:</h5>
                <div className="preview-inputs">
                  <input
                    type="text"
                    value={previewData.userName}
                    onChange={(e) => setPreviewData(prev => ({ ...prev, userName: e.target.value }))}
                    placeholder="User Name"
                    className="preview-input"
                  />
                  <input
                    type="text"
                    value={previewData.gymName}
                    onChange={(e) => setPreviewData(prev => ({ ...prev, gymName: e.target.value }))}
                    placeholder="Gym Name"
                    className="preview-input"
                  />
                  <input
                    type="text"
                    value={previewData.itemName}
                    onChange={(e) => setPreviewData(prev => ({ ...prev, itemName: e.target.value }))}
                    placeholder="Item Name"
                    className="preview-input"
                  />
                </div>
              </div>
            </div>
            <div className="preview-result">
              <h5>Preview Result:</h5>
              <pre className="preview-content">{previewResult}</pre>
            </div>
          </div>
        )}

        <div className="settings-footer">
          <button className="reset-btn" onClick={handleReset}>
            🔄 Reset to Defaults
          </button>
          <div className="save-buttons">
            <button className="save-btn" onClick={handleSave}>
              💾 Save Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-settings-overlay">
      <div className="notification-settings-modal">
        <div className="settings-header">
          <h3>⚙️ Notification Settings</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="settings-content">
          {/* Tab Navigation */}
          <div className="settings-tabs">
            <button 
              className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button 
              className={`settings-tab ${activeTab === 'approval' ? 'active' : ''}`}
              onClick={() => setActiveTab('approval')}
            >
              Approval Workflow
            </button>
            <button 
              className={`settings-tab ${activeTab === 'managers' ? 'active' : ''}`}
              onClick={() => setActiveTab('managers')}
            >
              Managers
            </button>
          </div>

          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="settings-section">
              <h4>General Configuration</h4>
              
              <div className="setting-group">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                  />
                  Enable Notifications
                </label>
              </div>

              <div className="setting-group">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={settings.requireApproval}
                    onChange={(e) => setSettings(prev => ({ ...prev, requireApproval: e.target.checked }))}
                  />
                  Require Approval Before Sending
                </label>
              </div>

              <div className="setting-group">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={settings.autoSend}
                    onChange={(e) => setSettings(prev => ({ ...prev, autoSend: e.target.checked }))}
                  />
                  Auto-send After Approval
                </label>
              </div>

              <div className="setting-group">
                <label className="setting-label">Email Provider</label>
                <select
                  value={settings.emailProvider}
                  onChange={(e) => setSettings(prev => ({ ...prev, emailProvider: e.target.value }))}
                  className="setting-input"
                >
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailgun">Mailgun</option>
                  <option value="smtp">SMTP</option>
                </select>
              </div>

              <div className="setting-group">
                <label className="setting-label">From Email</label>
                <input
                  type="email"
                  value={settings.fromEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                  className="setting-input"
                />
              </div>

              <div className="setting-group">
                <label className="setting-label">From Name</label>
                <input
                  type="text"
                  value={settings.fromName}
                  onChange={(e) => setSettings(prev => ({ ...prev, fromName: e.target.value }))}
                  className="setting-input"
                />
              </div>

              <div className="setting-group">
                <label className="setting-label">API Key</label>
                <input
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="setting-input"
                  placeholder="Enter your API key"
                />
              </div>
            </div>
          )}





          {/* Preview Section */}
          <div className="preview-section">
            <h4>📧 Email Preview</h4>
            <div className="preview-controls">
              <div className="preview-data">
                <h5>Preview Data:</h5>
                <div className="preview-inputs">
                  <input
                    type="text"
                    value={previewData.userName}
                    onChange={(e) => setPreviewData(prev => ({ ...prev, userName: e.target.value }))}
                    placeholder="User Name"
                    className="preview-input"
                  />
                  <input
                    type="text"
                    value={previewData.gymName}
                    onChange={(e) => setPreviewData(prev => ({ ...prev, gymName: e.target.value }))}
                    placeholder="Gym Name"
                    className="preview-input"
                  />
                  <input
                    type="text"
                    value={previewData.itemName}
                    onChange={(e) => setPreviewData(prev => ({ ...prev, itemName: e.target.value }))}
                    placeholder="Item Name"
                    className="preview-input"
                  />
                </div>
              </div>
            </div>
            <div className="preview-result">
              <h5>Preview Result:</h5>
              <pre className="preview-content">{previewResult}</pre>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="reset-btn" onClick={handleReset}>
            🔄 Reset to Defaults
          </button>
          <div className="save-buttons">
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="save-btn" onClick={handleSave}>
              💾 Save Settings
            </button>
          </div>
        </div>
      </div>



    </div>
  );
};

export default NotificationSettings; 