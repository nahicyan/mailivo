// ===== User Model (api/src/models/User.model.ts) =====
import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  company: {
    name: string;
    domain: string;
  };
  landivo_integration: {
    api_key?: string;
    webhook_secret?: string;
    last_sync?: Date;
  };
  email_settings: {
    sendgrid_api_key?: string;
    smtp_config?: {
      host: string;
      port: number;
      user: string;
      pass: string;
    };
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  company: {
    name: { type: String, required: true },
    domain: { type: String, required: true },
  },
  landivo_integration: {
    api_key: String,
    webhook_secret: String,
    last_sync: Date,
  },
  email_settings: {
    sendgrid_api_key: String,
    smtp_config: {
      host: String,
      port: Number,
      user: String,
      pass: String,
    },
  },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>('User', userSchema);
