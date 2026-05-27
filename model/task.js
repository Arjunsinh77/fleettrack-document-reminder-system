const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
    truckNo: String,
    owner: String,
    mobile: String,
    insurance: Date,

    alertSent: {          
        type: Boolean,
        default: false
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
});

module.exports = mongoose.model("task", taskSchema);