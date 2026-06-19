import server from './auth';
import { ENDPOINTS } from './endpoints';

export const getRentalCategories = async () => {
  try {
    const response = await server.get(ENDPOINTS.GET_RENTAL_CATEGORIES, {
      requiresAuth: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching rental categories:', error);
    throw error;
  }
};

export const getRentalProducts = async (categoryId?: string, search?: string) => {
  try {
    const response = await server.get(ENDPOINTS.GET_RENTAL_PRODUCTS(categoryId, search),{
      requiresAuth: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching rental products:', error);
    throw error;
  }
};

export const getRentalProductById = async (productId: string) => {
  try {
    const response = await server.get(ENDPOINTS.GET_RENTAL_PRODUCT_DETAILS(productId),
  {
    requiresAuth: true,
  });
    return response.data;
  } catch (error) {
    console.error('Error fetching rental product details:', error);
    throw error;
  }
};

export const calculateLivePrice = async (productId: string, durationType: string, durationValue: number) => {
  try {
    const response = await server.post(ENDPOINTS.CALCULATE_RENTAL_PRICE, {
      productId,
      durationType,
      durationValue
    },{
      requiresAuth: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error calculating live price:', error);
    throw error;
  }
};

export const placeRentalOrder = async (orderData: any) => {
  try {
    const response = await server.post(ENDPOINTS.PLACE_RENTAL_ORDER, orderData,{
      requiresAuth: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error placing rental order:', error);
    throw error;
  }
};

export const getPatientOrders = async (userId: string) => {
  try {
    const response = await server.get(ENDPOINTS.GET_PATIENT_ORDERS(userId), {
      requiresAuth: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching patient orders:', error);
    throw error;
  }
};

export const cancelRentalOrder = async (orderId: string, reasonData: any) => {
  try {
    const response = await server.post(ENDPOINTS.CANCEL_RENTAL_ORDER(orderId), reasonData, {
      requiresAuth: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
};

export const scheduleRentalReturn = async (orderId: string, scheduleData: any) => {
  try {
    const response = await server.post(ENDPOINTS.SCHEDULE_RENTAL_RETURN(orderId), scheduleData, {
      requiresAuth: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error scheduling return:', error);
    throw error;
  }
};

export const getRentalOrderTracking = async (orderId: string) => {
  try {
    const response = await server.get(ENDPOINTS.GET_RENTAL_ORDER_TRACKING(orderId), {
      requiresAuth: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching order tracking:', error);
    throw error;
  }
};

export const verifyRentalOrderPayment = async (orderId: string) => {
  try {
    const response = await server.post(ENDPOINTS.VERIFY_RENTAL_PAYMENT, { orderId }, {
      requiresAuth: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying rental payment:', error);
    throw error;
  }
};
