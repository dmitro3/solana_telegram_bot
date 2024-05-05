let customSendMessage = async (bot, msg, text, inlineButtons = [], parse_mode = "HTML") => {
    await bot.sendPhoto(msg.chat.id, global._config.BOT_SETTING.BG_URL, { caption: text, reply_markup: { inline_keyboard: inlineButtons, parse_mode: parse_mode } });
    return;
}

let customEditMessage = async (bot, msg, text, inlineButtons = [], parse_mode = "HTML") => {
    await bot.editMessageCaption(text, {
        message_id: msg.message_id,
        chat_id: msg.chat.id,
        parse_mode: parse_mode,
        reply_markup: {
            inline_keyboard: inlineButtons
        }
    })
}

module.exports = { customSendMessage, customEditMessage };