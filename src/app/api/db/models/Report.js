import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'wakeup',
        'departure',
        'arrival',
        'completed',
        'delayed',
        'canceled',
      ],
      required: true,
    },
    estimatedTime: {
      type: String,
      default: 0,
    },
    currentStep: {
      type: Number,
      enum: [0, 1, 2, 3],
      default: 0,
    },
    memo: { type: String },
    reportedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

delete mongoose.models.Report; // ✅ 기존 모델 제거
export default mongoose.models.Report || mongoose.model('Report', ReportSchema);
