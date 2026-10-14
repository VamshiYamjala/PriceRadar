import mongoose from 'mongoose';

const notificationEventSchema = new mongoose.Schema({
    deduplicationKey: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    alertId: { type: String, required: true },
    offerId: { type: String, required: true },
    priceInPaise: { type: Number, required: true },
    triggeredAtHour: { type: String, required: true },
    channel: { type: String, required: true, enum: ['email', 'telegram'] },
    recipient: { type: String, required: true },
    status: { type: String, required: true, enum: ['sent', 'failed'] },
    providerMessageId: { type: String },
    errorMessage: { type: String },
    attempts: { type: Number, default: 1 }
}, {
    timestamps: true
});

export const NotificationEvent = mongoose.models.NotificationEvent || mongoose.model('NotificationEvent', notificationEventSchema);
export default NotificationEvent;
