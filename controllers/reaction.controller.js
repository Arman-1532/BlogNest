const reactionService = require('../services/reaction.service');

const toggleReaction = async (req, res, next) => {
  try {
    const { type } = req.body;
    const { postId } = req.params;

    if (!type || !['LIKE', 'DISLIKE'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Reaction type must be LIKE or DISLIKE.' });
    }

    const result = await reactionService.toggleReaction(req.user.id, parseInt(postId), type);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getReactionsByPost = async (req, res, next) => {
  try {
    const result = await reactionService.getReactionsByPost(parseInt(req.params.postId));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getUserReaction = async (req, res, next) => {
  try {
    const reaction = await reactionService.getUserReaction(req.user.id, parseInt(req.params.postId));
    res.status(200).json({ success: true, data: { reaction } });
  } catch (error) {
    next(error);
  }
};

module.exports = { toggleReaction, getReactionsByPost, getUserReaction };

