import React, { createContext, useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";

const DirCtx = createContext("ltr");

export function DirectionProvider({ children }){
  const { i18n } = useTranslation();
  const dir = i18n.dir();
  useEffect(()=>{ document.dir = dir; }, [dir]);
  return <DirCtx.Provider value={dir}>{children}</DirCtx.Provider>;
}

export function useDir(){ return useContext(DirCtx); }
