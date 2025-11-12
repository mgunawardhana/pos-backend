const mongoose = require('mongoose');

const connectDB = async () => {

    try {
        await mongoose.connect("mongodb://localhost:27017/posDB", {
            useNewUrlParser: true, useUnifiedTopology: true,
        });
        console.info('Connected to DB');
    } catch (e) {
        console.error(e);
        // eslint-disable-next-line no-undef
        process.exit(1);
    }
}

module.exports = connectDB;