const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const c = require('../controllers/BooksController');

router.get('/inventory',          auth, c.getInventory);
router.get('/requests/my',        auth, c.getMyRequests);
router.get('/requests/pending',   auth, c.getPendingRequests);
router.get('/requests/all',       auth, c.getAllRequests);
router.post('/requests',          auth, c.submitRequest);
router.put('/requests/:id/status', auth, c.updateRequestStatus);
router.get('/',                   auth, c.getBooks);
router.get('/:id',                auth, c.getBookById);
router.post('/',                  auth, c.createBook);
router.put('/:id',                auth, c.updateBook);

module.exports = router;
