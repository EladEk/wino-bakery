import { useEffect, useState, useCallback } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function useSaleConfig(){
  const [saleDate, setSaleDate] = useState("");
  const [startHour, setStartHour] = useState("");
  const [endHour, setEndHour] = useState("");
  const [address, setAddress] = useState("");
  const [bitNumber, setBitNumber] = useState("");

  useEffect(()=>{
    const ref = doc(db, "config", "saleDate");
    getDoc(ref).then(snap=>{
      if(snap.exists()){
        const d = snap.data();
        setSaleDate(d.value || "");
        setStartHour(d.startHour || "");
        setEndHour(d.endHour || "");
        setAddress(d.address || "");
        setBitNumber(d.bitNumber || "");
      }
    });
  }, []);

  const save = useCallback(async ()=>{
    const ref = doc(db, "config", "saleDate");
    await setDoc(ref, { value: saleDate, startHour, endHour, address, bitNumber });
  }, [saleDate, startHour, endHour, address, bitNumber]);

  return { saleDate, setSaleDate, startHour, setStartHour, endHour, setEndHour, address, setAddress, bitNumber, setBitNumber, save };
}
