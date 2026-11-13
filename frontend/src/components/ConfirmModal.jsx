import React from 'react';

function ConfirmModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Підтвердження", 
    children, 
    confirmText = "Так", 
    cancelText = "Скасувати",
    confirmType = "danger" 
}) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-base" onClick={(e) => e.stopPropagation()}>
                <h3 className="modal-title">{title}</h3>
                
                <div className="modal-text">
                    {children}
                </div>
                
                <div className="modal-actions">
                    <button className={`btn-modal ${confirmType}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                    <button className="btn-modal cancel" onClick={onClose}>
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;