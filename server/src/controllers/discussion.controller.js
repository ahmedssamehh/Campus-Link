const Question = require('../models/Question');
const Answer = require('../models/Answer');

const buildVoteState = (doc, userId) => {
    const uid = userId ? userId.toString() : null;
    const upvoteCount = doc.upvotes?.length || 0;
    const downvoteCount = doc.downvotes?.length || 0;

    return {
        ...doc.toObject(),
        votes: upvoteCount - downvoteCount,
        userVote: uid ?
            (doc.upvotes.some((id) => id.toString() === uid) ?
                'up' :
                (doc.downvotes.some((id) => id.toString() === uid) ? 'down' : null)) : null
    };
};

const applyVote = (doc, userId, type) => {
    const uid = userId.toString();
    const upIndex = doc.upvotes.findIndex((id) => id.toString() === uid);
    const downIndex = doc.downvotes.findIndex((id) => id.toString() === uid);

    if (type === 'up') {
        if (upIndex !== -1) {
            return false;
        }
        if (downIndex !== -1) {
            doc.downvotes.splice(downIndex, 1);
        }
        doc.upvotes.push(userId);
        return true;
    }

    if (downIndex !== -1) {
        return false;
    }
    if (upIndex !== -1) {
        doc.upvotes.splice(upIndex, 1);
    }
    doc.downvotes.push(userId);
    return true;
};

exports.getAllQuestions = async(req, res) => {
    try {
        const questions = await Question.find()
            .populate('author', 'name role profilePhoto')
            .sort({ createdAt: -1 });

        const answerCountRows = await Answer.aggregate([{
            $group: {
                _id: '$question',
                count: { $sum: 1 }
            }
        }]);
        const answerCountMap = new Map(
            answerCountRows.map((row) => [row._id.toString(), row.count])
        );

        const currentUserId = req.user?._id?.toString();

        const payload = questions.map((q) => {
            return {
                ...buildVoteState(q, currentUserId),
                answersCount: answerCountMap.get(q._id.toString()) || 0
            };
        });

        return res.status(200).json({
            success: true,
            count: payload.length,
            questions: payload
        });
    } catch (error) {
        console.error('Get all questions error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch questions',
            error: error.message
        });
    }
};

exports.getQuestionById = async(req, res) => {
    try {
        const question = await Question.findById(req.params.id)
            .populate('author', 'name role profilePhoto')
            .populate('group', 'name subject');

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        const answers = await Answer.find({ question: question._id })
            .populate('author', 'name role profilePhoto')
            .sort({ createdAt: 1 });

        const currentUserId = req.user?._id;

        return res.status(200).json({
            success: true,
            question: buildVoteState(question, currentUserId),
            answers: answers.map((answer) => buildVoteState(answer, currentUserId))
        });
    } catch (error) {
        console.error('Get question by id error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch question details',
            error: error.message
        });
    }
};

exports.createQuestion = async(req, res) => {
    try {
        const { title, content, tags = [], group = null } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required'
            });
        }

        const normalizedTags = Array.isArray(tags) ?
            tags.map((tag) => String(tag).trim()).filter(Boolean) :
            String(tags || '')
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean);

        const question = await Question.create({
            title: title.trim(),
            content: content.trim(),
            author: req.user._id,
            group: group || null,
            tags: normalizedTags
        });

        await question.populate('author', 'name role profilePhoto');

        return res.status(201).json({
            success: true,
            message: 'Question created successfully',
            question: buildVoteState(question, req.user._id)
        });
    } catch (error) {
        console.error('Create question error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create question',
            error: error.message
        });
    }
};

exports.createAnswer = async(req, res) => {
    try {
        const { id: questionId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Answer content is required'
            });
        }

        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        const answer = await Answer.create({
            content: content.trim(),
            author: req.user._id,
            question: questionId
        });

        await answer.populate('author', 'name role profilePhoto');

        return res.status(201).json({
            success: true,
            message: 'Answer posted successfully',
            answer: buildVoteState(answer, req.user._id)
        });
    } catch (error) {
        console.error('Create answer error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to post answer',
            error: error.message
        });
    }
};

exports.voteQuestion = async(req, res) => {
    try {
        const { id } = req.params;
        const { type } = req;

        const question = await Question.findById(id).populate('author', 'name role profilePhoto');
        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        const changed = applyVote(question, req.user._id, type);
        if (!changed) {
            return res.status(400).json({
                success: false,
                message: `You already ${type === 'up' ? 'upvoted' : 'downvoted'} this question`
            });
        }

        question.votes = question.upvotes.length - question.downvotes.length;
        await question.save();

        return res.status(200).json({
            success: true,
            message: 'Vote recorded',
            question: buildVoteState(question, req.user._id)
        });
    } catch (error) {
        console.error('Vote question error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to vote on question',
            error: error.message
        });
    }
};

exports.voteAnswer = async(req, res) => {
    try {
        const { id } = req.params;
        const { type } = req;

        const answer = await Answer.findById(id).populate('author', 'name role profilePhoto');
        if (!answer) {
            return res.status(404).json({
                success: false,
                message: 'Answer not found'
            });
        }

        const changed = applyVote(answer, req.user._id, type);
        if (!changed) {
            return res.status(400).json({
                success: false,
                message: `You already ${type === 'up' ? 'upvoted' : 'downvoted'} this answer`
            });
        }

        answer.votes = answer.upvotes.length - answer.downvotes.length;
        await answer.save();

        return res.status(200).json({
            success: true,
            message: 'Vote recorded',
            answer: buildVoteState(answer, req.user._id)
        });
    } catch (error) {
        console.error('Vote answer error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to vote on answer',
            error: error.message
        });
    }
};

exports.setQuestionSolved = async(req, res) => {
    try {
        const { id } = req.params;
        const { isSolved = true } = req.body;

        const question = await Question.findById(id).populate('author', 'name role profilePhoto');
        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        question.isSolved = Boolean(isSolved);
        await question.save();

        return res.status(200).json({
            success: true,
            message: question.isSolved ? 'Question marked as solved' : 'Question marked as unsolved',
            question: buildVoteState(question, req.user._id)
        });
    } catch (error) {
        console.error('Set question solved error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update question solved state',
            error: error.message
        });
    }
};