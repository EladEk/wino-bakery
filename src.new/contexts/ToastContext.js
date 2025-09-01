import React, { createContext, useContext, useState, useCallback } from "react";

const ToastCtx = createContext(null);

export function ToastProvider({ children }){
  const [state, setState] = useState({ show:false, error:false, message:'' });
  const show = useCallback((message, error=false)=> setState({ show:true, error, message }), []);
  const hide = useCallback(()=> setState({ show:false, error:false, message:'' }), []);
  const value = { toast: { show, hide, state } };
  return <ToastCtx.Provider value={value}>{children}</ToastCtx.Provider>;
}

export function useToast(){
  const ctx = useContext(ToastCtx);
  if(!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}
