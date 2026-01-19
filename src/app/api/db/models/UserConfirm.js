import mongoose from 'mongoose';

const UserConfirmSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    scheduleId: {
      type: String,
      ref: 'Schedule',
      required: true,
    },
    userId: {
      type: String,
      ref: 'User',
      required: true,
    },
    confirmed: {
      type: Boolean,
      default: true,
    },
    confirmedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

delete mongoose.models.UserConfirm; // ✅ 기존 모델 제거
export default mongoose.models.UserConfirm ||
  mongoose.model('UserConfirm', UserConfirmSchema);

