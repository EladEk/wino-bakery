import { db } from "./firestore";
import { collection, doc, onSnapshot, updateDoc, getDocs, addDoc, writeBatch, serverTimestamp } from "firebase/firestore";

export const breadsCol = () => collection(db, "breads");
export const breadRef = (id) => doc(db, "breads", id);

export function subscribeBreads(cb) {
  return onSnapshot(breadsCol(), snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

export async function saveBread(b) {
  await updateDoc(breadRef(b.id), {
    name: b.name,
    description: b.description,
    availablePieces: Number(b.availablePieces),
    price: Number(b.price),
    show: !!b.show,
    isFocaccia: !!b.isFocaccia,
  });
}

export async function toggleShow(breadId, current) {
  await updateDoc(breadRef(breadId), { show: !current });
}

export async function updateClaimQuantity(bread, idx, newQty) {
  const diff = newQty - bread.claimedBy[idx].quantity;
  const updated = bread.claimedBy.map((c, i) => i === idx ? { ...c, quantity: newQty } : c);
  await updateDoc(breadRef(bread.id), { claimedBy: updated, availablePieces: bread.availablePieces - diff });
}

export async function removeClaim(bread, idx) {
  const removed = bread.claimedBy[idx];
  const updated = bread.claimedBy.filter((_, i) => i !== idx);
  await updateDoc(breadRef(bread.id), { claimedBy: updated, availablePieces: bread.availablePieces + (removed.quantity || 0) });
}

export async function endSaleArchiveAndClear() {
  const snap = await getDocs(breadsCol());
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  await addDoc(collection(db, "ordersHistory"), {
    saleDate: serverTimestamp(),
    breads: all.map(b => ({ breadId: b.id, breadName: b.name, breadDescription: b.description, breadPrice: b.price, orders: (b.claimedBy || []).map(o => ({ ...o })) })),
  });
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { claimedBy: [] }));
  await batch.commit();
}
