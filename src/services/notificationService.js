import CONFIG from '../config';

class NotificationService {
  constructor() {
    this.notificationQueue = [];
    this.isProcessing = false;
  }

  // Process email template with variables
  processTemplate(template, variables) {
    let processedTemplate = template;
    
    Object.keys(variables).forEach(key => {
      const placeholder = `{${key}}`;
      const value = variables[key] || '';
      processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return processedTemplate;
  }

  // Add notification to queue
  addToQueue(notification) {
    const queueItem = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      notification,
      status: 'pending', // pending, approved, sent, failed
      approvedBy: null,
      approvedAt: null
    };
    
    this.notificationQueue.push(queueItem);
    
    if (CONFIG.NOTIFICATIONS.REVIEW.REQUIRE_APPROVAL) {
      console.log('📧 Notification queued for approval:', queueItem);
      this.showApprovalNotification(queueItem);
    } else {
      this.sendNotification(queueItem);
    }
    
    return queueItem.id;
  }

  // Show approval notification to admin
  showApprovalNotification(queueItem) {
    const approvalModal = document.createElement('div');
    approvalModal.className = 'notification-approval-modal';
    approvalModal.innerHTML = `
      <div class="approval-modal-content">
        <h3>📧 Notification Approval Required</h3>
        <div class="notification-preview">
          <strong>To:</strong> ${queueItem.notification.to.name} (${queueItem.notification.to.email})
          <br><strong>Subject:</strong> ${queueItem.notification.subject}
          <br><strong>Type:</strong> ${queueItem.notification.type}
          <br><strong>Gym:</strong> ${queueItem.notification.data.gymName}
          <br><strong>Item:</strong> ${queueItem.notification.data.itemName}
        </div>
        <div class="approval-actions">
          <button class="approve-btn" onclick="window.approveNotification('${queueItem.id}')">✅ Approve & Send</button>
          <button class="reject-btn" onclick="window.rejectNotification('${queueItem.id}')">❌ Reject</button>
        </div>
      </div>
    `;
    
    approvalModal.style.cssText = `
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
    `;
    
    document.body.appendChild(approvalModal);
    
    // Add global functions for approval/rejection
    window.approveNotification = (id) => this.approveNotification(id);
    window.rejectNotification = (id) => this.rejectNotification(id);
  }

  // Approve notification
  approveNotification(id) {
    const queueItem = this.notificationQueue.find(item => item.id === id);
    if (queueItem) {
      queueItem.status = 'approved';
      queueItem.approvedBy = 'admin'; // In real app, get current user
      queueItem.approvedAt = Date.now();
      
      this.sendNotification(queueItem);
      this.closeApprovalModal();
    }
  }

  // Reject notification
  rejectNotification(id) {
    const queueItem = this.notificationQueue.find(item => item.id === id);
    if (queueItem) {
      queueItem.status = 'rejected';
      this.closeApprovalModal();
    }
  }

  // Close approval modal
  closeApprovalModal() {
    const modal = document.querySelector('.notification-approval-modal');
    if (modal) {
      modal.remove();
    }
  }

  // Send notification
  async sendNotification(queueItem) {
    try {
      queueItem.status = 'sending';
      
      if (CONFIG.NOTIFICATIONS.EMAIL_SERVICE.PROVIDER === 'sendgrid') {
        await this.sendViaSendGrid(queueItem);
      } else {
        // Fallback to console logging for development
        await this.sendViaConsole(queueItem);
      }
      
      queueItem.status = 'sent';
      queueItem.sentAt = Date.now();
      
      console.log('✅ Notification sent successfully:', queueItem);
      this.showSuccessMessage(queueItem);
      
    } catch (error) {
      queueItem.status = 'failed';
      queueItem.error = error.message;
      
      console.error('❌ Failed to send notification:', error);
      this.showErrorMessage(queueItem);
    }
  }

  // Send via SendGrid (future implementation)
  async sendViaSendGrid(queueItem) {
    // This would be implemented with actual SendGrid API
    // For now, we'll simulate the API call
    console.log('📧 Sending via SendGrid:', queueItem.notification);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In real implementation:
    // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${CONFIG.NOTIFICATIONS.EMAIL_SERVICE.API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     personalizations: [{
    //       to: [{ email: queueItem.notification.to.email, name: queueItem.notification.to.name }]
    //     }],
    //     from: { email: CONFIG.NOTIFICATIONS.EMAIL_SERVICE.FROM_EMAIL, name: CONFIG.NOTIFICATIONS.EMAIL_SERVICE.FROM_NAME },
    //     subject: queueItem.notification.subject,
    //     content: [{ type: 'text/plain', value: queueItem.notification.body }]
    //   })
    // });
    
    // if (!response.ok) {
    //   throw new Error(`SendGrid API error: ${response.status}`);
    // }
  }

  // Send via console (development fallback)
  async sendViaConsole(queueItem) {
    console.log('📧 EMAIL NOTIFICATION (Development Mode)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${queueItem.notification.to.name} <${queueItem.notification.to.email}>`);
    console.log(`From: ${CONFIG.NOTIFICATIONS.EMAIL_SERVICE.FROM_NAME} <${CONFIG.NOTIFICATIONS.EMAIL_SERVICE.FROM_EMAIL}>`);
    console.log(`Subject: ${queueItem.notification.subject}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(queueItem.notification.body);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Direct Link: ${queueItem.notification.data.appLink}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  // Show success message
  showSuccessMessage(queueItem) {
    // Temporarily disabled to avoid conflicts with main notification system
    console.log('✅ Notification sent to', queueItem.notification.to.name);
    /*
    const message = document.createElement('div');
    message.textContent = `✅ Notification sent to ${queueItem.notification.to.name}`;
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
    */
  }

  // Show error message
  showErrorMessage(queueItem) {
    // Temporarily disabled to avoid conflicts with main notification system
    console.log('❌ Failed to send notification to', queueItem.notification.to.name);
    /*
    const message = document.createElement('div');
    message.textContent = `❌ Failed to send notification to ${queueItem.notification.to.name}`;
    message.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: #dc3545;
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
    }, 5000);
    */
  }

  // Create tag notification
  createTagNotification(taggedUser, taggerName, gym, item, noteText) {
    if (!CONFIG.NOTIFICATIONS.ENABLED || !CONFIG.NOTIFICATIONS.TYPES.TAG.ENABLED) {
      return null;
    }

    const template = CONFIG.NOTIFICATIONS.TYPES.TAG.TEMPLATE;
    const variables = {
      userName: taggedUser.name,
      taggerName: taggerName || 'Unknown User',
      gymName: gym,
      itemName: item["Item Name"] || 'Unknown Item',
      itemBrand: item.Brand || 'Unknown Brand',
              partNumber: item["EXOS Part Number"] || 'N/A',
      itemStatus: item.status || 'Pending Approval',
      justification: item.justification || 'N/A',
      noteText: noteText || 'No additional notes',
      appLink: `${window.location.origin}/my-react-app/?gym=${gym}&item=${encodeURIComponent(item["Item Name"] || '')}`
    };

    const body = this.processTemplate(template, variables);

    return {
      type: 'TAG',
      to: {
        name: taggedUser.name,
        email: taggedUser.email
      },
      subject: CONFIG.NOTIFICATIONS.TYPES.TAG.SUBJECT,
      body,
      data: variables
    };
  }

  // Get notification queue
  getQueue() {
    return this.notificationQueue;
  }

  // Clear old notifications
  clearOldNotifications() {
    const cutoff = Date.now() - CONFIG.NOTIFICATIONS.REVIEW.QUEUE_TIMEOUT;
    this.notificationQueue = this.notificationQueue.filter(item => item.timestamp > cutoff);
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService; 