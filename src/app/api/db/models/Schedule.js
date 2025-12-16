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
    date: { type: String, required: true }, // UI용: "2024-01-15"
    time: {
      type: String, // UI용: "11:30"
      required: true,
    },
    scheduledAt: { type: Date }, // 로직/쿼리용: Date 객체
    location: { type: String }, // 실 주소 (예: "노원구 섬밭로 258 건영옴니백화점")
    venue: { type: String }, // 장소명 (예: "노원 비엔티 컨벤션 6층 단독홀")
    memo: { type: String },
    status: {
      type: String,
      enum: ['unassigned', 'assigned', 'completed'],
      default: 'unassigned',
    },
  },
  { timestamps: true }
);

// date와 time을 합쳐서 scheduledAt 자동 생성
ScheduleSchema.pre('save', function (next) {
  if (this.date && this.time) {
    // date: "2024-01-15", time: "11:30" -> scheduledAt: Date 객체
    const dateTimeString = `${this.date}T${this.time}:00`;
    this.scheduledAt = new Date(dateTimeString);
  }
  next();
});

delete mongoose.models.Schedule; // ✅ 기존 모델 제거
export default mongoose.models.Schedule ||
  mongoose.model('Schedule', ScheduleSchema);
