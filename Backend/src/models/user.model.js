const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is Required for Account Creation"],
      unique: [true, "Email is already taken"],
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Email is not in proper format",
      ],
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, "Name is required to create an A/C"],
    },
    password: {
      type: String,
      required: [true, "Password is required to create an A/C"],
      select: false,
      minlength: [6, "Password should be more than 6 characters"],
    },
    isSystemUser: {
      type: Boolean,
      default: false,
      select: false,
      immutable: true
    }
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function() { // if password is Updated
  if (!this.isModified("password")) {
    return;
  }

  const hash = await bcrypt.hash(this.password, 15);
  this.password = hash;

  return;
});

userSchema.methods.comparePassword = async function(password) {
    const result = await bcrypt.compare(password, this.password)

    return result;
}

const userModel = mongoose.model("user", userSchema);


module.exports = userModel;