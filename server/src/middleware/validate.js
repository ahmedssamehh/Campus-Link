const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
        const messages = error.details.map((d) => d.message).join(', ');
        return res.status(400).json({ success: false, message: messages });
    }
    next();
};

const schemas = {
    register: Joi.object({
        name: Joi.string().trim().min(2).max(50).required(),
        email: Joi.string().email().lowercase().trim().required(),
        password: Joi.string().min(6).max(128).required(),
        role: Joi.string().valid('user', 'admin').optional(),
    }),

    login: Joi.object({
        email: Joi.string().email().lowercase().trim().required(),
        password: Joi.string().required(),
    }),

    forgotPassword: Joi.object({
        email: Joi.string().email().lowercase().trim().required(),
    }),

    resetPassword: Joi.object({
        email: Joi.string().email().lowercase().trim().required(),
        code: Joi.string().length(6).pattern(/^\d+$/).required(),
        newPassword: Joi.string().min(6).max(128).required(),
    }),

    createGroup: Joi.object({
        name: Joi.string().trim().min(2).max(100).required(),
        subject: Joi.string().trim().min(2).max(100).required(),
        description: Joi.string().trim().max(500).optional().allow(''),
    }),

    createQuestion: Joi.object({
        title: Joi.string().trim().min(5).max(200).required(),
        content: Joi.string().trim().min(10).max(5000).required(),
        group: Joi.string().optional().allow(null, ''),
        tags: Joi.array().items(Joi.string().trim().max(30)).max(10).optional(),
    }),

    createAnswer: Joi.object({
        content: Joi.string().trim().min(1).max(5000).required(),
    }),

    createAnnouncement: Joi.object({
        groupId: Joi.string().required(),
        title: Joi.string().trim().min(2).max(200).required(),
        content: Joi.string().trim().min(1).max(5000).required(),
        visibleTo: Joi.array().items(Joi.string()).optional(),
    }),

    createGroupAnnouncement: Joi.object({
        title: Joi.string().trim().min(2).max(200).required(),
        content: Joi.string().trim().min(1).max(5000).required(),
    }),

    sendMessage: Joi.object({
        content: Joi.string().trim().min(1).max(5000).required(),
        group: Joi.string().optional().allow(null),
        receiver: Joi.string().optional().allow(null),
        type: Joi.string().valid('text', 'file', 'system').optional(),
    }),
};

module.exports = { validate, schemas };
