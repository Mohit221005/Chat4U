import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  
  email: {
    type: String,
    required:true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength:6
  },
  profilePic:{
    type:String,
    default: "https://avatar.iran.liara.run/public"
  },
},
{timestamps:true }
);

/**
 * Indexes for optimized query performance
 */

// Email is already unique, but explicit index for faster lookups
userSchema.index({ email: 1 });

// Text index on fullName for future search functionality
// Supports queries: { $text: { $search: "search term" } }
userSchema.index({ fullName: 'text' }); 

const User = mongoose.model('User',userSchema);
export default User;