import mongoose from 'mongoose';
const transactionSchema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, type: { type: String, enum: ['income','expense'], required: true }, amount: { type: Number, required: true, min: 0.01, max: 100000000000 }, category: { type: String, required: true, trim: true, maxlength: 60 }, description: { type: String, trim: true, maxlength: 160, default: '' }, date: { type: Date, required: true, default: Date.now }, paymentMethod: { type: String, enum: ['UPI','Cash','Card','Bank transfer','Other'], default: 'UPI' }, recurring: { type: Boolean, default: false } }, { timestamps: true });
transactionSchema.index({ user: 1, date: -1 });
export default mongoose.model('Transaction', transactionSchema);
