const mongoose = require("mongoose");
const { Schema } = mongoose;

const bookServiceSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "service",
      default: null,
    },
    isBooked: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

mongoose.model("bookService", bookServiceSchema);
