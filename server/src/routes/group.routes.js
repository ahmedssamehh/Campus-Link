// src/routes/group.routes.js
const express = require('express');
const router = express.Router();
const {
    createGroup,
    getAllGroups,
    getGroupById,
    requestToJoinGroup,
    getJoinRequests,
    approveJoinRequest,
    rejectJoinRequest
} = require('../controllers/group.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

// CREATE & LIST GROUPS
router.post('/', authorize('admin', 'owner'), createGroup);
router.get('/', getAllGroups);

// JOIN REQUEST MANAGEMENT (STATIC ROUTES FIRST ✅)
router.get('/requests/all', authorize('admin', 'owner'), getJoinRequests);
router.patch('/requests/:id/approve', authorize('admin', 'owner'), approveJoinRequest);
router.patch('/requests/:id/reject', authorize('admin', 'owner'), rejectJoinRequest);

// GROUP-SPECIFIC ROUTES (DYNAMIC LAST ✅)
router.get('/:id', getGroupById);
router.post('/:id/join', authorize('user', 'admin', 'owner'), requestToJoinGroup);

module.exports = router;