const mongoose = require('mongoose');

const userPickSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    event_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PickemEvent',
        required: true
    },
    picks: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
});

// Уникальный индекс, чтобы у одного юзера был только один документ с прогнозами на одно событие
userPickSchema.index({ user_id: 1, event_id: 1 }, { unique: true });

module.exports = mongoose.model('UserPick', userPickSchema);