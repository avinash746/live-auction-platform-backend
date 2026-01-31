const auctionService = require('../services/auctionService');

/**
 * Initialize Socket.io event handlers
 */
function initializeSocketHandlers(io) {
  // Track connected users
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Store user connection
    connectedUsers.set(socket.id, {
      socketId: socket.id,
      connectedAt: Date.now()
    });

    // Send initial data to newly connected client
    socket.emit('INITIAL_DATA', {
      items: auctionService.getAllItems(),
      serverTime: Date.now()
    });

    /**
     * Handle BID_PLACED event
     * This is where the race condition protection happens
     */
    socket.on('BID_PLACED', async (data) => {
      const { itemId, bidAmount } = data;
      const userId = socket.id; // Using socket ID as user ID for this demo

      console.log(`📊 Bid attempt - Item: ${itemId}, Amount: $${bidAmount}, User: ${userId}`);

      try {
        // Validate input
        if (!itemId || !bidAmount || typeof bidAmount !== 'number') {
          socket.emit('BID_ERROR', {
            error: 'INVALID_DATA',
            message: 'Invalid bid data provided'
          });
          return;
        }

        // Attempt to place bid with race condition protection
        const result = await auctionService.placeBid(itemId, userId, bidAmount);

        if (result.success) {
          console.log(`✅ Bid accepted - Item: ${itemId}, Amount: $${bidAmount}`);

          // Broadcast to ALL clients including sender
          io.emit('UPDATE_BID', {
            itemId: result.data.itemId,
            currentBid: result.data.currentBid,
            highestBidder: result.data.highestBidder,
            timestamp: result.data.timestamp,
            previousBidder: result.data.previousBidder
          });

          // Send success confirmation to bidder
          socket.emit('BID_SUCCESS', {
            itemId: result.data.itemId,
            currentBid: result.data.currentBid,
            message: 'Your bid has been placed successfully!'
          });

          // Notify previous bidder they were outbid
          if (result.data.previousBidder && result.data.previousBidder !== userId) {
            io.to(result.data.previousBidder).emit('OUTBID', {
              itemId: result.data.itemId,
              currentBid: result.data.currentBid,
              yourBid: result.data.previousBid,
              message: 'You have been outbid!'
            });
          }
        } else {
          // Bid failed - send error to requesting client only
          console.log(`❌ Bid rejected - Item: ${itemId}, Reason: ${result.error}`);
          
          socket.emit('BID_ERROR', {
            itemId,
            error: result.error,
            message: result.message
          });
        }
      } catch (error) {
        console.error('Error processing bid:', error);
        socket.emit('BID_ERROR', {
          itemId,
          error: 'SERVER_ERROR',
          message: 'An error occurred processing your bid'
        });
      }
    });

    /**
     * Handle REQUEST_SYNC event
     * Client can request time sync at any time
     */
    socket.on('REQUEST_SYNC', () => {
      socket.emit('TIME_SYNC', {
        serverTime: Date.now()
      });
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      connectedUsers.delete(socket.id);
    });
  });

  // Broadcast auction end events
  setInterval(() => {
    auctionService.getAllItems().forEach(item => {
      if (!item.isActive && item.timeRemaining <= 0) {
        io.emit('AUCTION_ENDED', {
          itemId: item.id,
          finalBid: item.currentBid,
          winner: item.highestBidder
        });
      }
    });
  }, 5000);

  console.log('✅ Socket.io handlers initialized');
}

module.exports = { initializeSocketHandlers };