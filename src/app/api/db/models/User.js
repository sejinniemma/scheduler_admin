import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    gender: { type: String, enum: ['MALE', 'FEMALE'] },
    role: {
      type: String,
      enum: ['ADMIN', 'VIDEOGRAPHER', 'PHOTOGRAPHER', 'IPHONESNAPPER'], // 어드민, 영상, 사진, 아이폰스냅
      default: 'PHOTOGRAPHER',
    },
    address: { type: String },
    mainLocation: { type: String },
    hasVehicle: { type: Boolean, default: false },
    startDate: { type: Date, required: true },
    birthDate: { type: Date },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'] },
    memo: { type: String },
  },
  { timestamps: true }
);

delete mongoose.models.User; // ✅ 기존 모델 제거
export default mongoose.models.User || mongoose.model('User', UserSchema);
