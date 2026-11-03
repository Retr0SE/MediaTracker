import React, { createContext, useState, useContext, useCallback} from "react";
const ToastContext = createContext()

export const useToast = () => useContext(ToastContext)
export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState()
    const showToast = useCallback((text, type='success') => {
        setToast({text, type});
        setTimeout(() => {
            setToast(null);
        }, 3500)
    }, [])
    return(
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.type}`}>
                        {toast.text}
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
};