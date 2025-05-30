import { z } from "zod";

// Define profile schema
export const ProfileSchema = z.object({
  name: z.string().optional(),
  institution: z.string().optional(),
  country: z.string().optional(),
  avatarUrl: z.string().optional(),
  bio: z.string().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;

// Define follower schema
export const FollowerSchema = z.object({
  userId: z.string(),
  followedAt: z.string().optional(),
});

export type Follower = z.infer<typeof FollowerSchema>;

// Define user schema
export const UserSchema = z.object({
  _id: z.string(),
  username: z.string(),
  email: z.string().email(),
  online: z.boolean().default(false),
  role: z.enum(["admin", "participant"]),
  profilePicture: z.string().optional(),
  profile: ProfileSchema.optional(),
  followers: z.array(FollowerSchema).optional(),
  following: z.array(FollowerSchema).optional(),
  rating: z.number().default(1000),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type User = z.infer<typeof UserSchema>;

// Auth response schema
export const AuthResponseSchema = z.object({
  user: UserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// Login credentials schema
export const LoginCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;

// Register credentials schema
export const RegisterCredentialsSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

export type RegisterCredentials = z.infer<typeof RegisterCredentialsSchema>;

// OTP verification schema
export const OtpVerificationSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export type OtpVerification = z.infer<typeof OtpVerificationSchema>;

// Password reset request schema
export const PasswordResetRequestSchema = z.object({
  email: z.string().email(),
});

export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;

// Password update schema
export const PasswordUpdateSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(6),
});

export type PasswordUpdate = z.infer<typeof PasswordUpdateSchema>;

// Google login schema
export const GoogleLoginSchema = z.object({
  idToken: z.string(),
});

export type GoogleLogin = z.infer<typeof GoogleLoginSchema>;