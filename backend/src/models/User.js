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
    default:"https://res.cloudinary.com/dyj24qk3c/image/upload/v1598706713/ProfilePic/default_profile_pic_1_xzv8xg.png"
  },
},
{timestamps:true }
); 

const User = mongoose.model('User',userSchema);
export default User;