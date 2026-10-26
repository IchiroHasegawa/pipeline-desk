import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, timestamped } from "./_shared";

export const CONNECTION_STATUSES = ["Connected", "Disconnected", "Error"] as const;

const StorageConnectionSchema = new Schema(
  {
    _id: uuidPk,
    provider: { type: String, required: true, enum: ["google_drive"] },
    status: { type: String, required: true, enum: CONNECTION_STATUSES },
    // Encrypted in application code with GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY, not
    // by the database. select:false so it is never returned incidentally.
    encryptedRefreshToken: { type: String, required: true, select: false },
    connectionName: { type: String },
    accountLabel: { type: String },
    rootFolderId: { type: String },
    lastConnectedAt: { type: Date },
    lastError: { type: String },
  },
  { ...timestamped, collection: "storage_connections" }
);

StorageConnectionSchema.set("toJSON", {
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret.encryptedRefreshToken;
    return ret;
  },
});

export type StorageConnectionDoc = InferSchemaType<typeof StorageConnectionSchema> & {
  _id: string;
};

export const StorageConnection: Model<StorageConnectionDoc> =
  (mongoose.models.StorageConnection as Model<StorageConnectionDoc>) ??
  mongoose.model<StorageConnectionDoc>("StorageConnection", StorageConnectionSchema);
