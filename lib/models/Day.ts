import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, refTo, timestamped } from "./_shared";

const DaySchema = new Schema(
  {
    _id: uuidPk,
    episodeId: refTo("Episode", true),
    dayDate: { type: Date, required: true },
    title: { type: String },
    description: { type: String },
    sortOrder: { type: Number },
  },
  { ...timestamped, collection: "days" }
);

DaySchema.index({ episodeId: 1, dayDate: 1 });

export type DayDoc = InferSchemaType<typeof DaySchema> & { _id: string };

export const Day: Model<DayDoc> =
  (mongoose.models.Day as Model<DayDoc>) ?? mongoose.model<DayDoc>("Day", DaySchema);
