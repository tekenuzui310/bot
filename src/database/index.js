const { JsonDatabase } = require("wio.db");
const { QuickDB } = require("quick.db");
const { owner, channelID } = require("../../config.json");

const db = new JsonDatabase({ databasePath: "./src/database/configuration.json" });
const lg = new QuickDB({ filePath: "./src/database/logs.sqlite" });

module.exports = {
    db,
    lg,
    owner,
    channelID
};