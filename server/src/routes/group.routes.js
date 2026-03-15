const express = require('express');
const router = express.Router();
const {
    createGroup, getAllGroups, getMyGroups, getGroupById,
    requestToJoinGroup, getJoinRequests, approveJoinRequest,
    rejectJoinRequest, deleteGroup, removeMember, leaveGroup
} = require('../controllers/group.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validate');

router.use(protect);

router.post('/', authorize('admin', 'owner'), validate(schemas.createGroup), createGroup);
router.get('/', getAllGroups);
router.get('/my', getMyGroups);

router.get('/requests/all', authorize('admin', 'owner'), getJoinRequests);
router.patch('/requests/:id/approve', authorize('admin', 'owner'), approveJoinRequest);
router.patch('/requests/:id/reject', authorize('admin', 'owner'), rejectJoinRequest);

router.get('/:id', getGroupById);
router.delete('/:id', authorize('admin', 'owner'), deleteGroup);
router.post('/:id/join', authorize('user', 'admin', 'owner'), requestToJoinGroup);
router.delete('/:groupId/leave', leaveGroup);
router.delete('/:groupId/members/:memberId', authorize('admin', 'owner'), removeMember);

module.exports = router;
