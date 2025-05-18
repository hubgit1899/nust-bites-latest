import mongoose, { Schema, Document, Types } from "mongoose";

export interface User extends Document {
  _id: { toString(): string };
  username: string;
  email: string;
  password: string;
  verifyCode?: string | null;
  verifyCodeExpiry?: Date;
  isVerified: boolean;

  isCustomer?: boolean;
  fullName?: string;
  phoneNumber?: string;

  orders?: Types.ObjectId[]; // <- Changed to ObjectId[]

  // Admin fields
  isSuperAdmin: boolean;
  isRiderAdmin: boolean;
  isRestaurantAdmin: boolean;
  adminRestaurantIds: Types.ObjectId[]; // <- Changed to ObjectId[]
  isRestaurantOwner: boolean;
  ownedRestaurantIds: Types.ObjectId[]; // <- Changed to ObjectId[]
  maxOwnedRestaurants: number;

  // Rider fields
  isRider: boolean;
  isRiderVerified: boolean;
  isRiderAvailable: boolean;
  isRiderOnDuty: boolean;
  isAcceptingOrders: boolean;
  balance: number;

  cnic?: string;
  cnicExpiryDate?: Date;
  cnicFrontUrl?: string;
  cnicBackUrl?: string;

  licenseNumber?: string;
  licenseExpiryDate?: Date;
  licenseFrontUrl?: string;
  licenseBackUrl?: string;

  isUniStudent: boolean;
  university?: string;
  studentId?: string;
  studentIdFrontUrl?: string;
  studentIdBackUrl?: string;

  isHostelite: boolean;
  hostelName?: string;
  roomNumber?: string;
}

const UserSchema: Schema<User> = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required."],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9_.]{3,}$/,
        "Username must be at least 3 characters and contain only letters, numbers, underscores, or dots.",
      ],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address."],
    },
    password: { type: String, required: [true, "Password is required."] },
    verifyCode: { type: String, default: null },
    verifyCodeExpiry: { type: Date, default: null },
    isVerified: { type: Boolean, default: false },

    // Personal fields
    fullName: { type: String },
    phoneNumber: {
      type: String,
      match: [/^\d{11}$/, "Phone number must be 11 digits."],
    },
    isCustomer: { type: Boolean, default: false },
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],

    // Admin fields
    isSuperAdmin: { type: Boolean, default: false },
    isRiderAdmin: { type: Boolean, default: false },
    isRestaurantAdmin: { type: Boolean, default: false },
    adminRestaurantIds: [{ type: Schema.Types.ObjectId, ref: "Restaurant" }],
    isRestaurantOwner: { type: Boolean, default: false },
    ownedRestaurantIds: [{ type: Schema.Types.ObjectId, ref: "Restaurant" }],
    maxOwnedRestaurants: { type: Number, default: 2 },

    // Rider fields
    isRider: { type: Boolean, default: false },
    isRiderVerified: { type: Boolean, default: false },
    isRiderAvailable: { type: Boolean, default: false },
    isRiderOnDuty: { type: Boolean, default: false },
    isAcceptingOrders: { type: Boolean, default: false },
    balance: { type: Number, default: 0 },

    // Verification fields
    // // CNIC and License
    cnic: { type: String },
    cnicExpiryDate: { type: Date },
    cnicFrontUrl: { type: String }, // Google Drive file URL
    cnicBackUrl: { type: String },

    licenseNumber: { type: String },
    licenseExpiryDate: { type: Date },
    licenseFrontUrl: { type: String }, // Google Drive file URL
    licenseBackUrl: { type: String },

    // // // University student fields
    isUniStudent: { type: Boolean, default: false },
    university: { type: String },
    studentId: { type: String },
    studentIdFrontUrl: { type: String }, // Google Drive file URL
    studentIdBackUrl: { type: String },

    isHostelite: { type: Boolean, default: false },
    hostelName: { type: String },
    roomNumber: { type: String },
  },
  {
    timestamps: true, // ✅ This adds createdAt and updatedAt automatically
  }
);

const UserModel =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>("User", UserSchema);
export default UserModel;
