const AuctionItem = require('../models/AuctionItem');

class AuctionService {
  constructor() {
    this.items = new Map();
    this.initializeItems();
    this.startAuctionMonitoring();
  }

  /**
   * Initialize sample auction items
   */
  initializeItems() {
    const sampleItems = [
      {
        id: '1',
        title: 'Vintage Rolex Watch',
        description: 'Rare 1960s Rolex Submariner in excellent condition',
        startingPrice: 5000,
        imageUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400',
        durationMinutes: 5
      },
      {
        id: '2',
        title: 'MacBook Pro M3 Max',
        description: 'Latest MacBook Pro with M3 Max chip, 64GB RAM',
        startingPrice: 3000,
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
        durationMinutes: 5
      },
      {
        id: '3',
        title: 'Rare Pokémon Card Set',
        description: 'Complete first edition holographic set',
        startingPrice: 1500,
        imageUrl: 'https://images.unsplash.com/photo-1613771404721-1f92d799e49f?w=400',
        durationMinutes: 5
      },
      {
        id: '4',
        title: 'Gibson Les Paul Guitar',
        description: '1959 Gibson Les Paul Standard - Sunburst',
        startingPrice: 8000,
        imageUrl: 'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=400',
        durationMinutes: 5
      },
      {
        id: '5',
        title: 'Sony A7R V Camera',
        description: 'Professional full-frame mirrorless camera with lens',
        startingPrice: 3500,
        imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400',
        durationMinutes: 5
      },
      {
        id: '6',
        title: 'Limited Edition Sneakers',
        description: 'Nike Air Jordan 1 Retro High OG - Chicago',
        startingPrice: 800,
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
        durationMinutes: 5
      }
    ];

    sampleItems.forEach(itemData => {
      const item = new AuctionItem(
        itemData.id,
        itemData.title,
        itemData.description,
        itemData.startingPrice,
        itemData.imageUrl,
        itemData.durationMinutes
      );
      this.items.set(itemData.id, item);
    });

    console.log(`✅ Initialized ${this.items.size} auction items`);
  }

  /**
   * Monitor auctions and handle automatic endings
   */
  startAuctionMonitoring() {
    setInterval(() => {
      this.items.forEach((item, itemId) => {
        if (item.checkAndEndAuction()) {
          console.log(`🔚 Auction ended for: ${item.title}`);
          // Could emit socket event here if io instance was passed
        }
      });
    }, 1000); // Check every second
  }

  /**
   * Get all auction items
   */
  getAllItems() {
    return Array.from(this.items.values()).map(item => item.toJSON());
  }

  /**
   * Get single auction item
   */
  getItem(itemId) {
    return this.items.get(itemId);
  }

  /**
   * Place a bid on an item
   */
  async placeBid(itemId, userId, bidAmount) {
    const item = this.items.get(itemId);
    
    if (!item) {
      return {
        success: false,
        error: 'ITEM_NOT_FOUND',
        message: 'Auction item not found'
      };
    }

    return await item.placeBid(userId, bidAmount);
  }

  /**
   * Get server time for client synchronization
   */
  getServerTime() {
    return {
      timestamp: Date.now(),
      iso: new Date().toISOString()
    };
  }

  /**
   * Reset an auction (for testing/demo purposes)
   */
  resetAuction(itemId) {
    const item = this.items.get(itemId);
    if (item) {
      item.currentBid = item.startingPrice;
      item.highestBidder = null;
      item.bidHistory = [];
      item.endTime = Date.now() + (5 * 60 * 1000);
      item.isActive = true;
      return { success: true, data: item.toJSON() };
    }
    return { success: false, error: 'Item not found' };
  }
}

module.exports = new AuctionService();