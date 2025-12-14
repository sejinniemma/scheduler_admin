import mongoose from 'mongoose';

const ScheduleSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    mainUser: {
      type: String,
      ref: 'User',
      required: true,
    },
    subUser: {
      type: String,
      ref: 'User',
    },
    groom: { type: String, required: true },
    bride: { type: String, required: true },
    date: { type: String, required: true },
    time: {
      type: String, // "11:30"
      required: true,
    },
    location: { type: String }, // 실 주소 (예: "노원구 섬밭로 258 건영옴니백화점")
    venue: { type: String }, // 장소명 (예: "노원 비엔티 컨벤션 6층 단독홀")
    memo: { type: String },
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
      default: 'pending',
    },
    subStatus: {
      type: String,
      enum: ['unassigned', 'assigned', 'completed'],
      default: 'unassigned',
    },
  },
  { timestamps: true }
);

delete mongoose.models.Schedule; // ✅ 기존 모델 제거
export default mongoose.models.Schedule ||
  mongoose.model('Schedule', ScheduleSchema);
