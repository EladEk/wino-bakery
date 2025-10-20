import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useKibbutz } from './useKibbutz';
import { breadsService } from '../services/breads';

export const useOrders = () => {
  const { currentUser, userData } = useAuth();
  const { kibbutzim } = useKibbutz();
  const [breads, setBreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderQuantities, setOrderQuantities] = useState({});
  const [userClaims, setUserClaims] = useState({});

  useEffect(() => {
    const unsubscribe = breadsService.subscribe((breadsData) => {
      const visibleBreads = breadsData.filter(b => b.show !== false);
      setBreads(visibleBreads);

      const claims = {};
      visibleBreads.forEach(bread => {
        const claim = (bread.claimedBy || []).find(c => c.userId === currentUser?.uid);
        if (claim) claims[bread.id] = claim;
      });
      setUserClaims(claims);

      setOrderQuantities(() => {
        const quantities = {};
        visibleBreads.forEach(bread => {
          quantities[bread.id] = Number(claims[bread.id]?.quantity || 0);
        });
        return quantities;
      });

      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const breadsToOrder = useMemo(
    () => breads.filter(b => Number(userClaims[b.id]?.quantity || 0) === 0),
    [breads, userClaims]
  );

  const breadsOrdered = useMemo(
    () => breads.filter(b => Number(userClaims[b.id]?.quantity || 0) > 0),
    [breads, userClaims]
  );

  const hasChanges = useMemo(
    () => breads.some(b => Number(userClaims[b.id]?.quantity || 0) !== Number(orderQuantities[b.id] || 0)),
    [breads, userClaims, orderQuantities]
  );

  const hasAnyInput = useMemo(
    () => Object.values(orderQuantities).some(q => Number(q) > 0),
    [orderQuantities]
  );

  const userTotalCost = useMemo(() => {
    return breadsOrdered.reduce((sum, bread) => {
      // Use the saved quantity from userClaims for ordered breads, not orderQuantities
      const qty = Number(userClaims[bread.id]?.quantity || 0);
      if (bread.price == null) return sum;
      
      let finalPrice = bread.price;
      
      if (userData?.kibbutzId && kibbutzim) {
        const userKibbutz = kibbutzim.find(k => k.id === userData.kibbutzId);
        if (userKibbutz) {
          if (userKibbutz.discountPercentage > 0) {
            const discount = userKibbutz.discountPercentage / 100;
            finalPrice = finalPrice * (1 - discount);
          }
          
          if (userKibbutz.surchargeType && userKibbutz.surchargeType !== 'none' && userKibbutz.surchargeValue > 0) {
            if (userKibbutz.surchargeType === 'percentage') {
              finalPrice = finalPrice * (1 + userKibbutz.surchargeValue / 100);
            } else if (userKibbutz.surchargeType === 'fixed') {
              finalPrice = finalPrice + userKibbutz.surchargeValue;
            }
          }
        }
      }
      
      return sum + (qty * finalPrice);
    }, 0);
  }, [breadsOrdered, userClaims, userData?.kibbutzId, kibbutzim]);

  const updateQuantity = (breadId, quantity) => {
    setOrderQuantities(prev => ({ ...prev, [breadId]: quantity }));
  };

  const placeOrder = async () => {
    const orders = [];
    
    for (const bread of breads) {
      const qty = Number(orderQuantities[bread.id] || 0);
      const hasClaim = !!userClaims[bread.id];
      
      if (qty > 0 && !hasClaim) {
        orders.push({
          breadId: bread.id,
          quantity: qty,
          bread
        });
      }
    }

    if (orders.length === 0) return;

    for (const order of orders) {
      await breadsService.addOrder(order.breadId, {
        userId: currentUser.uid,
        name: currentUser.displayName || 'Unknown',
        phone: currentUser.phoneNumber || '',
        quantity: order.quantity,
        kibbutzId: userData?.kibbutzId || null,
        kibbutzName: userData?.kibbutzName || null,
        discountPercentage: userData?.kibbutzId ? 
          (await import('../services/kibbutz')).kibbutzService.getById(userData.kibbutzId)
            .then(kibbutz => kibbutz?.discountPercentage || 0) : 0
      });
    }
  };

  const updateOrder = async () => {
    for (const bread of breads) {
      const prev = userClaims[bread.id];
      const newQty = Number(orderQuantities[bread.id] || 0);

      if (prev) {
        if (newQty === 0) {
          const orderIndex = bread.claimedBy.findIndex(c => c.userId === currentUser.uid);
          if (orderIndex !== -1) {
            await breadsService.removeOrder(bread.id, orderIndex);
          }
        } else if (newQty !== prev.quantity) {
          const orderIndex = bread.claimedBy.findIndex(c => c.userId === currentUser.uid);
          if (orderIndex !== -1) {
            await breadsService.updateOrderQuantity(bread.id, orderIndex, newQty);
          }
        }
      } else if (newQty > 0) {
        await breadsService.addOrder(bread.id, {
          userId: currentUser.uid,
          name: currentUser.displayName || 'Unknown',
          phone: currentUser.phoneNumber || '',
          quantity: newQty
        });
      }
    }
  };

  const cancelOrder = async () => {
    for (const bread of breads) {
      const prev = userClaims[bread.id];
      if (!prev) continue;

      const orderIndex = bread.claimedBy.findIndex(c => c.userId === currentUser.uid);
      if (orderIndex !== -1) {
        await breadsService.removeOrder(bread.id, orderIndex);
      }
    }
  };

  return {
    breads,
    breadsToOrder,
    breadsOrdered,
    loading,
    orderQuantities,
    userClaims,
    hasChanges,
    hasAnyInput,
    userTotalCost,
    updateQuantity,
    placeOrder,
    updateOrder,
    cancelOrder
  };
};
