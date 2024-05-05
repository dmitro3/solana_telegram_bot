const path = require('path');
const rootPath = path.normalize(__dirname);

let config = {
    ROOT: rootPath,
    PORT: process.env.PORT || 5800,
    MONGO_URI: 'mongodb://localhost:27017/solanabot',
    BOT_SETTING: {
        BG_URL: process.env.BG_URL,
        TOKEN: process.env.TOKEN,
        MASTER: process.env.MASTER,
        SPAM_COUNT: 50
    },
    BUY_PERCENT: Number(process.env.BUY_PERCENT) || 0.9,
    SLIPPAGE: Number(process.env.SLIPPAGE) || 0.01
}

module.exports = config;