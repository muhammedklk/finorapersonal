import mongoose from 'mongoose';
const schema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, category: { type: String, required: true, trim: true, maxlength: 60 }, limit: { type: Number, required: true, min: 1 }, month: { type: String, required: true, match: /^\d{4}-\d{2}$/ } }, { timestamps: true });
schema.index({ user: 1, category: 1, month: 1 }, { unique: true });
export default mongoose.model('Budget', schema);
