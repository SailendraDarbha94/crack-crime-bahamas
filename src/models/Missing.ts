import mongoose from "mongoose";

interface Missing extends mongoose.Document {
  name: string;
  alias: string;
  created_at: number;
  updated_at: number;
  age: number;
  sex: string;
  image_url: string;
  last_known_address: string;
}

/* MissingSchema will correspond to a collection in your MongoDB database. */
const MissingSchema = new mongoose.Schema<Missing>({
  name: {
    /* The name of this person */

    type: String,
    required: [true, "Please provide a name for this person."],
    maxlength: [60, "Name cannot be more than 60 characters"],
  },
  alias: {
    /* any other known names he may respond to */

    type: String,
    required: false,
    maxlength: [60, "alias Name cannot be more than 60 characters"],
  },
  created_at: {
    required: false,
    type: Number
  },
  updated_at: {
    required: false,
    type: Number
  },
  age: {
    /* Person's age, optional */
    required: false,
    type: Number,
  },
  sex: {
    /* */
  },
  image_url: {
    /* Url to persons image */

    required: false,
    type: String,
  },
  last_known_address: {
    required: false,
    type: String
  }
});

export default mongoose.models.Missing || mongoose.model<Missing>("Missing", MissingSchema, "members");
//module.exports = mongoose.model("Missing", MissingSchema)