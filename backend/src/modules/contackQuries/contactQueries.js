import mongoose from "mongoose";
const contactQueriesSchema = new mongoose.Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    phone: {
        type: String,
        required: true
    },
    message: {
        type: String,
    },
}, {
    timestamps: true,
})

export default mongoose.model("ContactQueries", contactQueriesSchema);
