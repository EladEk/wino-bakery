import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { breadsService } from '../services/breads';

export const useOrders = () => {
  const { currentUser } = useAuth();
  const [breads, setBreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderQuantities, setOrderQuantities] = useState({});
  const [userClaims, setUserClaims] = useState({});

  useEffect(() => {
    const unsubscribe = breadsService.subscribe((breadsData) => {
      const visibleBreads = breadsData.filter(b => b.show !== false);
      setBreads(visibleBreads);

      // Extract current user claims
      const claims = {};
      visibleBreads.forEach(bread => {
        const claim = (bread.claimedBy || []).find(c => c.userId === currentUser?.uid);
        if (claim) claims[bread.id] = claim;
      });
      setUserClaims(claims);

      // Sync UI inputs with saved claims
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

  // Split breads by saved quantities
  const breadsToOrder = useMemo(
    () => breads.filter(b => Number(userClaims[b.id]?.quantity || 0) === 0),
    [breads, userClaims]
  );

  const breadsOrdered = useMemo(
    () => breads.filter(b => Number(userClaims[b.id]?.quantity || 0) > 0),
    [breads, userClaims]
  );

  // Check for unsaved changes
  const hasChanges = useMemo(
    () => breads.some(b => Number(userClaims[b.id]?.quantity || 0) !== Number(orderQuantities[b.id] || 0)),
    [breads, userClaims, orderQuantities]
  );

  // Check if there's any input selected
  const hasAnyInput = useMemo(
    () => Object.values(orderQuantities).some(q => Number(q) > 0),
    [orderQuantities]
  );

  // Calculate user total cost with kibbutz discount
  const userTotalCost = useMemo(() => {
    return breadsOrdered.reduce((sum, bread) => {
      const qty = Number(orderQuantities[bread.id] || 0);
      if (bread.price == null) return sum;
      
      const basePrice = qty * bread.price;
      const discountPercentage = userData?.kibbutzId ? 
        (bread.claimedBy?.find(c => c.userId === currentUser?.uid)?.discountPercentage || 0) : 0;
      
      const discountAmount = basePrice * (discountPercentage / 100);
      return sum + (basePrice - discountAmount);
    }, 0);
  }, [breadsOrdered, orderQuantities, userData?.kibbutzId, currentUser?.uid]);

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

    // Process orders sequentially to avoid race conditions
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
          // Remove order
          const orderIndex = bread.claimedBy.findIndex(c => c.userId === currentUser.uid);
          if (orderIndex !== -1) {
            await breadsService.removeOrder(bread.id, orderIndex);
          }
        } else if (newQty !== prev.quantity) {
          // Update quantity
          const orderIndex = bread.claimedBy.findIndex(c => c.userId === currentUser.uid);
          if (orderIndex !== -1) {
            await breadsService.updateOrderQuantity(bread.id, orderIndex, newQty);
          }
        }
      } else if (newQty > 0) {
        // Add new order
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
