/**
 * Modal Dialog Manager
 * Replaces browser alert/confirm/prompt with custom modals
 */

class ModalManager {
    constructor() {
        this.overlay = document.getElementById('modalOverlay');
        
        // Alert Modal
        this.alertModal = document.getElementById('alertModal');
        this.alertTitle = document.getElementById('alertTitle');
        this.alertMessage = document.getElementById('alertMessage');
        this.alertIcon = document.getElementById('alertIcon');
        this.alertOkBtn = document.getElementById('alertOkBtn');
        
        // Confirm Modal
        this.confirmModal = document.getElementById('confirmModal');
        this.confirmTitle = document.getElementById('confirmTitle');
        this.confirmMessage = document.getElementById('confirmMessage');
        this.confirmOkBtn = document.getElementById('confirmOkBtn');
        this.confirmCancelBtn = document.getElementById('confirmCancelBtn');
        
        // Prompt Modal
        this.promptModal = document.getElementById('promptModal');
        this.promptTitle = document.getElementById('promptTitle');
        this.promptMessage = document.getElementById('promptMessage');
        this.promptInput = document.getElementById('promptInput');
        this.promptOkBtn = document.getElementById('promptOkBtn');
        this.promptCancelBtn = document.getElementById('promptCancelBtn');
        
        this.init();
    }
    
    init() {
        console.log('✓ ModalManager initialized');
        
        // Alert OK button
        this.alertOkBtn.addEventListener('click', () => {
            this.hideAlert();
        });
        
        // Prompt input - Enter key
        this.promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.promptOkBtn.click();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.promptCancelBtn.click();
            }
        });
        
        // ESC key to close alert
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('visible')) {
                this.hideAll();
            }
        });
    }
    
    /**
     * Show alert dialog
     */
    showAlert(message, title = 'Notice', type = 'info') {
        this.alertTitle.textContent = title;
        this.alertMessage.textContent = message;
        
        // Set icon type
        this.alertIcon.className = 'modal-icon';
        if (type === 'error') {
            this.alertIcon.classList.add('error');
        } else if (type === 'success') {
            this.alertIcon.classList.add('success');
        } else if (type === 'warning') {
            this.alertIcon.classList.add('warning');
        }
        
        this.showModal(this.alertModal);
    }
    
    /**
     * Show confirm dialog
     */
    showConfirm(message, title = 'Confirm') {
        return new Promise((resolve) => {
            this.confirmTitle.textContent = title;
            this.confirmMessage.textContent = message;
            
            // Clone buttons to remove old event listeners
            const oldOkBtn = this.confirmOkBtn;
            const newOkBtn = oldOkBtn.cloneNode(true);
            oldOkBtn.parentNode.replaceChild(newOkBtn, oldOkBtn);
            this.confirmOkBtn = newOkBtn;
            
            const oldCancelBtn = this.confirmCancelBtn;
            const newCancelBtn = oldCancelBtn.cloneNode(true);
            oldCancelBtn.parentNode.replaceChild(newCancelBtn, oldCancelBtn);
            this.confirmCancelBtn = newCancelBtn;
            
            // Add new event listeners
            this.confirmOkBtn.addEventListener('click', () => {
                resolve(true);
                this.hideConfirm();
            });
            
            this.confirmCancelBtn.addEventListener('click', () => {
                resolve(false);
                this.hideConfirm();
            });
            
            this.showModal(this.confirmModal);
        });
    }
    
    /**
     * Show prompt dialog
     */
    showPrompt(message, title = 'Enter URL', defaultValue = '') {
        return new Promise((resolve) => {
            this.promptTitle.textContent = title;
            this.promptMessage.textContent = message;
            this.promptInput.value = defaultValue;
            
            // Clone buttons to remove old event listeners
            const oldOkBtn = this.promptOkBtn;
            const newOkBtn = oldOkBtn.cloneNode(true);
            oldOkBtn.parentNode.replaceChild(newOkBtn, oldOkBtn);
            this.promptOkBtn = newOkBtn;
            
            const oldCancelBtn = this.promptCancelBtn;
            const newCancelBtn = oldCancelBtn.cloneNode(true);
            oldCancelBtn.parentNode.replaceChild(newCancelBtn, oldCancelBtn);
            this.promptCancelBtn = newCancelBtn;
            
            // Add new event listeners
            this.promptOkBtn.addEventListener('click', () => {
                const value = this.promptInput.value.trim();
                resolve(value);
                this.hidePrompt();
            });
            
            this.promptCancelBtn.addEventListener('click', () => {
                resolve(null);
                this.hidePrompt();
            });
            
            this.showModal(this.promptModal);
            
            // Focus input
            setTimeout(() => {
                this.promptInput.focus();
                this.promptInput.select();
            }, 150);
        });
    }
    
    /**
     * Show modal
     */
    showModal(modal) {
        this.hideAllModals();
        this.overlay.classList.add('visible');
        modal.classList.add('visible');
    }
    
    /**
     * Hide alert
     */
    hideAlert() {
        this.alertModal.classList.remove('visible');
        this.overlay.classList.remove('visible');
    }
    
    /**
     * Hide confirm
     */
    hideConfirm() {
        this.confirmModal.classList.remove('visible');
        this.overlay.classList.remove('visible');
    }
    
    /**
     * Hide prompt
     */
    hidePrompt() {
        this.promptModal.classList.remove('visible');
        this.overlay.classList.remove('visible');
        this.promptInput.value = '';
    }
    
    /**
     * Hide all modals
     */
    hideAllModals() {
        this.alertModal.classList.remove('visible');
        this.confirmModal.classList.remove('visible');
        this.promptModal.classList.remove('visible');
    }
    
    /**
     * Hide all
     */
    hideAll() {
        this.hideAlert();
        this.hideConfirm();
        this.hidePrompt();
    }
}