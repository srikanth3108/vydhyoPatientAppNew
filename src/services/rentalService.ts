import server from './auth';
import { ENDPOINTS } from './endpoints';

export const getRentalProducts = async () => {
  try {
    const response = await server.get(ENDPOINTS.GET_RENTAL_PRODUCTS,{
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
