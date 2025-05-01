import mongoose, { Schema, Document } from "mongoose";

interface Counter extends Document {
  _id: string;
  sequence_value: number;
}

const CounterSchema = new Schema<Counter>({
  _id: { type: String, required: true },
  sequence_value: { type: Number, required: true, default: 0 },
});

const CounterModel =
  (mongoose.models.Counter as mongoose.Model<Counter>) ||
  mongoose.model<Counter>("Counter", CounterSchema);
export default CounterModel;
