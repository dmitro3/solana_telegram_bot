// Config set
require('dotenv').config();
global._config = require('./src/config');
// Connect db
const mongoConnect = require('./src/db');
let botProgram = require('./src/bot');

mongoConnect(async () => {
    await botProgram.start();
});