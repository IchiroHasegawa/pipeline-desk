import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Identity AND profile in one collection.
 *
 * Under Supabase these were two tables: GoTrue's `auth.users` (email,
 * encrypted password) and `public.profiles` (username, display name, status,
 * role) joined on id. With GoTrue gone there is no second table to point at,
 * so they merge — which also removes the `handle_new_user` trigger that
 * copied metadata across on signup.
 *
 * Constraints are taken from docs/mongo-migration/schema-contract.json:
 *   CHECK (char_length(username) >= 3 AND char_length(username) <= 30)
 *   CHECK (username ~ '^[a-zA-Z0-9_]+$')
 *   CHECK (account_status IN ('active','suspended','disabled'))
 *   CHECK (system_role IN ('user','owner'))
 *   UNIQUE INDEX on lower(username)
 */
export const ACCOUNT_STATUSES = ["active", "suspended", "disabled"] as const;
export const SYSTEM_ROLES = ["user", "owner"] as const;

/** Case-insensitive equality, matching Postgres' `lower(...)` unique index. */
const CASE_INSENSITIVE = { locale: "en", strength: 2 } as const;

const ProfileSchema = new Schema(
  {
    _id: { type: String, required: true, default: () => crypto.randomUUID() },

    email: {
      type: String,
      required: true,
      // GoTrue stored emails lowercased; keep that.
      lowercase: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-zA-Z0-9_]+$/,
      // NOT lowercased: uniqueness is case-insensitive via the collation index
      // below, but the stored value keeps the casing the user chose. Downcasing
      // here would rename every existing account (e.g. `realTNEU`).
    },

    passwordHash: {
      type: String,
      required: true,
      // Never returned unless a caller explicitly asks. lib/auth is the only
      // place that should ever `.select("+passwordHash")`.
      select: false,
    },

    displayName: { type: String },
    avatarUrl: { type: String },

    accountStatus: {
      type: String,
      required: true,
      enum: ACCOUNT_STATUSES,
      default: "active",
      // The access-token phase changes this default to 'pending' and adds it
      // to ACCOUNT_STATUSES. Today it matches the live Postgres default.
    },

    systemRole: {
      type: String,
      required: true,
      enum: SYSTEM_ROLES,
      default: "user",
      // Writable only through lib/auth/roles.ts, which replaces the
      // prevent_system_role_update trigger.
    },
  },
  { timestamps: true, collection: "profiles" }
);

ProfileSchema.index({ email: 1 }, { unique: true, collation: CASE_INSENSITIVE });
ProfileSchema.index({ username: 1 }, { unique: true, collation: CASE_INSENSITIVE });

/**
 * `select: false` only hides the field from *queries*. A document returned by
 * `Profile.create()` is the one just constructed in memory, so it still carries
 * the plaintext hash and `JSON.stringify` would serialise it — which is how a
 * freshly-created profile returned toward a client leaks the hash. Strip it on
 * serialisation so that cannot happen however the document was obtained.
 *
 * `toObject()` deliberately still carries it: Mongoose uses it internally, and
 * lib/auth needs the value after an explicit select.
 */
ProfileSchema.set("toJSON", {
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret.passwordHash;
    return ret;
  },
});

export type ProfileDoc = InferSchemaType<typeof ProfileSchema> & { _id: string };

export const Profile: Model<ProfileDoc> =
  (mongoose.models.Profile as Model<ProfileDoc>) ??
  mongoose.model<ProfileDoc>("Profile", ProfileSchema);
