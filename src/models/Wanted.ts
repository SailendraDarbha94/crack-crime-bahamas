import mongoose from "mongoose";

interface Wanted extends mongoose.Document {
  _name: string;
  _description: string;
  _alias: string;
  _created_at: number;
  _updated_at: number;
  _age: number;
  _sex: string;
  _image_url: string;
  _last_known_address: string;
}

/* MissingSchema will correspond to a collection in your MongoDB database. */
const WantedSchema = new mongoose.Schema<Wanted>({
  _name: {
    /* The name of this person */
    type: String,
    required: [true, "Please provide a name for this person."],
    maxlength: [60, "Name cannot be more than 60 characters"],
  },
  _description:{
    type:String,
    required:false
  },
  _alias: {
    /* any other known names he may respond to */

    type: String,
    required: false,
    maxlength: [60, "alias Name cannot be more than 60 characters"],
  },
  _created_at: {
    required: false,
    type: Number
  },
  _updated_at: {
    required: false,
    type: Number
  },
  _age: {
    /* Person's age, optional */
    required: false,
    type: Number,
  },
  _sex: {
    /* */
  },
  _image_url: {
    /* Url to persons image */

    required: false,
    type: String,
  },
  _last_known_address: {
    required: false,
    type: String
  }
});

export default mongoose.models.Wanted || mongoose.model<Wanted>("Wanted", WantedSchema);
//module.exports = mongoose.model("Missing", MissingSchema)