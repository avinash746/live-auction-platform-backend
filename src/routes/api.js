const express = require('express');
const auctionService = require('../services/auctionService');

const router = express.Router();

/**
 * GET /api/items
 * Get all auction items
 */
router.get('/items', (req, res) => {
  try {
    const items = auctionService.getAllItems();
    res.json({
      success: true,
      data: items,
      serverTime: Date.now()
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch auction items'
    });
  }
});

/**
 * GET /api/items/:id
 * Get single auction item
 */
router.get('/items/:id', (req, res) => {
  try {
    const item = auctionService.getItem(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    res.json({
      success: true,
      data: item.toJSON(),
      serverTime: Date.now()
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch auction item'
    });
  }
});

/**
 * GET /api/time
 * Get server time for synchronization
 */
router.get('/time', (req, res) => {
  res.json(auctionService.getServerTime());
});

/**
 * POST /api/items/:id/reset
 * Reset an auction (for demo purposes)
 */
router.post('/items/:id/reset', (req, res) => {
  try {
    const result = auctionService.resetAuction(req.params.id);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error resetting auction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset auction'
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime()
  });
});

module.exports = router;