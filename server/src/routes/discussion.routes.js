const express = require('express');
const router = express.Router();
const {
    getAllQuestions,
    getQuestionById,
    createQuestion,
    createAnswer,
    setQuestionSolved,
    voteQuestion,
    voteAnswer
} = require('../controllers/discussion.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const setVoteType = (type) => (req, res, next) => {
    req.type = type;
    next();
};

router.get('/questions', getAllQuestions);
router.get('/questions/:id', getQuestionById);

router.post('/questions', protect, createQuestion);
router.post('/questions/:id/answers', protect, createAnswer);
router.patch('/questions/:id/solve', protect, authorize('admin', 'owner'), setQuestionSolved);

router.post('/questions/:id/upvote', protect, setVoteType('up'), voteQuestion);
router.post('/questions/:id/downvote', protect, setVoteType('down'), voteQuestion);

router.post('/answers/:id/upvote', protect, setVoteType('up'), voteAnswer);
router.post('/answers/:id/downvote', protect, setVoteType('down'), voteAnswer);

module.exports = router;