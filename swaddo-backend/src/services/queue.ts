import { logger } from '../utils/logger';

// Mock Queue since Redis is not available locally on Windows
export const orderQueue = {
  add: async (name: string, data: any) => {
    logger.info(`Mocking queue add for ${name}`);
    
    // Simulate background processing
    if (name === 'process-order') {
      setTimeout(() => {
        logger.info(`Mock successfully processed background tasks for order ${data.orderId}`);
      }, 1000);
    }
    
    return { id: Math.random().toString() };
  }
};

export const setupWorkers = () => {
  logger.info('Mock workers setup (BullMQ disabled locally to bypass Redis requirement)');
};
