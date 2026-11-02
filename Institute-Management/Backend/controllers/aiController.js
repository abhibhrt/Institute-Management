const aiService = require('../services/aiService');

exports.askAi = async (req, res) => {
    try {
        const { question, resultId } = req.body;
        if (!question) return res.status(400).json({ message: 'Question is required.' });

        const reply = await aiService.answerStudentDoubt(req.user.id, question, resultId);
        res.json({ question, response: reply });
    } catch (err) {
        res.status(503).json({ error: err.message });
    }
};