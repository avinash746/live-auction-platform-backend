class AuctionItem {
  constructor(id, title, description, startingPrice, imageUrl, durationMinutes = 5) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.startingPrice = startingPrice;
    this.currentBid = startingPrice;
    this.highestBidder = null;
    this.imageUrl = imageUrl;
    this.createdAt = Date.now();
    this.endTime = Date.now() + (durationMinutes * 60 * 1000);
    this.isActive = true;
    this.bidHistory = [];
    // Critical: Lock mechanism for race condition prevention
    this.bidLock = false;
  }

  /**
   * Validate and place a bid with race condition protection
   * @param {string} userId - User placing the bid
   * @param {number} bidAmount - Bid amount
   * @returns {Object} - Result object with success status and message
   */
  async placeBid(userId, bidAmount) {
    // Check if auction is still active
    if (!this.isActive || Date.now() >= this.endTime) {
      return {
        success: false,
        error: 'AUCTION_ENDED',
        message: 'This auction has ended'
      };
    }

    // Race condition protection: Check if another bid is being processed
    if (this.bidLock) {
      return {
        success: false,
        error: 'BID_IN_PROGRESS',
        message: 'Another bid is being processed. Please try again.'
      };
    }

    // Acquire lock
    this.bidLock = true;

    try {
      // Validate bid amount
      const minimumBid = this.currentBid + 10;
      
      if (bidAmount < minimumBid) {
        return {
          success: false,
          error: 'BID_TOO_LOW',
          message: `Bid must be at least $${minimumBid}`
        };
      }

      // Check if user is already the highest bidder
      if (this.highestBidder === userId) {
        return {
          success: false,
          error: 'ALREADY_HIGHEST',
          message: 'You are already the highest bidder'
        };
      }

      // Update bid
      const previousBidder = this.highestBidder;
      const previousBid = this.currentBid;
      
      this.currentBid = bidAmount;
      this.highestBidder = userId;
      
      // Record in history
      this.bidHistory.push({
        userId,
        amount: bidAmount,
        timestamp: Date.now()
      });

      return {
        success: true,
        data: {
          itemId: this.id,
          currentBid: this.currentBid,
          highestBidder: this.highestBidder,
          previousBidder,
          previousBid,
          timestamp: Date.now()
        }
      };
    } finally {
      // Always release lock
      this.bidLock = false;
    }
  }

  /**
   * Get item data for API response
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      startingPrice: this.startingPrice,
      currentBid: this.currentBid,
      highestBidder: this.highestBidder,
      imageUrl: this.imageUrl,
      endTime: this.endTime,
      isActive: this.isActive,
      bidCount: this.bidHistory.length,
      timeRemaining: Math.max(0, this.endTime - Date.now())
    };
  }

  /**
   * Check if auction should end
   */
  checkAndEndAuction() {
    if (this.isActive && Date.now() >= this.endTime) {
      this.isActive = false;
      return true;
    }
    return false;
  }
}

module.exports = AuctionItem;