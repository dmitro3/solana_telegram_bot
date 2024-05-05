const TelegramBot = require('node-telegram-bot-api');
const fs = require("fs");
const ncp = require("copy-paste");

const { createTxtTable } = require("./createTxtTable");
const { customEditMessage, customSendMessage } = require("./customMessage");

const { BOT_STATE, TRANSACTION_TYPE } = require("../constant");

const bot = new TelegramBot(_config.BOT_SETTING.TOKEN);

var botProgram = {
    bot: bot,
    bot_state: BOT_STATE.START,
    wallet_id: "",
    transaction_type: "",//buy or sell
    coin_address: "",
    dex: "",

    start: () => {

        bot.startPolling()
        console.log(` 🔌  ${global._config.BOT_SETTING.MASTER.toUpperCase()} BOT Connected to Polling...`);

        bot.on('polling_error', (error) => {
            console.log(error); // => 'EFATAL'
            return;
        });

        // when command is entered. ex: /start
        bot.onText(/.*/, async (message) => {
            const text = message.text;
            if (!text) return;

            //when '/start' command is entered
            if (text === "/start") {
                await botProgram.goToWelcomeState(message, true);
                return;
            }
            //when command is entered into default input.
            else {
                const current_bot_state = botProgram.bot_state;
                switch (current_bot_state) {
                    //when new wallet number to create is entered
                    case BOT_STATE.WALLET_MANAGE: {
                        botProgram.handleWalletNumberText(message);
                        return;
                    }
                    //when the address of coin to buy is entered
                    case BOT_STATE.COIN_SELECT: {
                        botProgram.goToDexSelect(message);
                        return;
                    }
                    default: return;
                }
            }
        });

        //when button is clicked
        bot.on("callback_query", async (callback_data) => {
            if (!callback_data.data) return;
            const command = callback_data.data;
            switch (command) {
                //when 'back' button is clicked
                case "back":
                    await botProgram.handleBackCommand(callback_data.message);
                    return;
                //when 'swap' button is clicked
                case "swap":
                    botProgram.goToBuySellSelect(callback_data.message);
                    return;
                //when 'wallet manage' button is clicked
                case "wallet_manage":
                    botProgram.goToWalletManageState(callback_data.message);
                    return;
                //when 'help' button is clicked
                case "help":
                    botProgram.goToHelpState(callback_data.message);
                    return;
                //when 'download wallet list' button is clicked
                case "download_wallet_list":
                    botProgram.handleDownloadCommand(callback_data.message);
                    return;
                //when 'buy' button is clicked
                case TRANSACTION_TYPE.BUY:
                    botProgram.goToCoinSelect(callback_data.message, command);
                    return;
                //when 'sell' button is clicked
                case TRANSACTION_TYPE.SELL:
                    botProgram.goToCoinSelect(callback_data.message, command);
                    return;
                //when 'raydium' button is clicked on dex select window
                case "raydium":
                    botProgram.goToConfirmState(callback_data.message, command);
                    return;
                //when 'jupiter' button is clicked on dex select window
                case "jupiter":
                    botProgram.goToConfirmState(callback_data.message, command);
                    return;
                //when 'no' button is clicked on confirm window
                case "go_welcome":
                    botProgram.goToWelcomeState(callback_data.message, false);
                    return;
                //when 'yes' button is clicked on confirm window
                case "run_transaction":
                    botProgram.runTransaction(callback_data.message);
                    return;

            }

            //when 'copy' button is clicked on wallet manage window
            if (command.startsWith("copy_address/")) {
                await botProgram.copyAddress(command);
                return;
            }
            return;
        })
    },

    // input command handler

    // wallet number handler
    handleWalletNumberText: async (message) => {
        const new_wallet_count = Number(message.text);
        if (new_wallet_count < 1) return;

        await generateWallet(new_wallet_count, message.chat.id);
        await botProgram.goToWalletManageState(message, false);
        return;
    },

    // call back command handler

    goToWelcomeState: async (message, from_start = true) => {
        botProgram.bot_state = BOT_STATE.WELCOME
        const text = "💐 Welcome to Micky's Trading Bot 💐\n\nBuy or Sell Solana 💲coins💲 using several wallets here\nHappy your trading in Solana\n\n";
        const inlineButtons = [
            [{ text: ' ♻️ SWAP', callback_data: 'swap' }],
            [{ text: ' 💳 WALLET MANAGE', callback_data: 'wallet_manage' }],
            [{ text: ' ❓ HELP', callback_data: 'help' }]
        ];
        if (from_start) await customSendMessage(bot, message, text, inlineButtons);
        else await customEditMessage(bot, message, text, inlineButtons);
        return;
    },
    goToWalletManageState: async (message, from_welcome = true) => {
        botProgram.bot_state = BOT_STATE.WALLET_MANAGE;
        const wallet_list = await walletModel.find({ chat_id: message.chat.id });
        const text = `🗝 Create new wallets\n\t\tenter the number of wallets to create a new one\n\n📝 Copy wallet address\n\t\tclick wallet item\n\n⬇ Save wallet keys\n\t\tclick download button( ⬇ )\n\n💳 current wallet list ( total: ${wallet_list.length} )`;
        let inlineButtons = [];
        for (index in wallet_list) {
            if ((wallet_list.length > 5) && (index == 3)) {
                inlineButtons.push([{ text: " . . . ", callback_data: "..." }]);
                continue;
            }
            if ((wallet_list.length > 5) && (index > 3) && (index < wallet_list.length - 2)) continue;
            let secret_key = wallet_list[index].secret_key.split(",").map((val) => Number(val));
            let balance = await getBalance(secret_key);
            let label = wallet_list[index].public_key.substr(0, 7) + " ... " + wallet_list[index].public_key.substr(-7) + ` (${balance}) `;
            inlineButtons.push([{ text: label, callback_data: "copy_address/" + wallet_list[index].public_key }]);
        }
        inlineButtons.push([{ text: ' 👈 BACk', callback_data: 'back' }, { text: '⬇ Download WalletList', callback_data: 'download_wallet_list' }]);
        if (from_welcome) await customEditMessage(bot, message, text, inlineButtons);
        else await customSendMessage(bot, message, text, inlineButtons);
        return;
    },
    copyAddress: async (command) => {
        // extart wallet address will be copied
        let wallet_address = command.split("/")[1];
        await ncp.copy(wallet_address);
        return;
    },
    goToHelpState: async (message) => {
        botProgram.bot_state = BOT_STATE.HELP;
        const text = " ♻️ SWAP\n \t\t 📌buy coins\n \t\t 📌sell coins\n \t\t 📌selece dex api\n\n 💳 WALLET MANAGE\n \t\t 📌create wallet\n \t\t 📌save list of wallet";
        const inlineButtons = [[{ text: '👈 BACk', callback_data: 'back' }]];
        await customEditMessage(bot, message, text, inlineButtons);
        return;
    },
    handleDownloadCommand: async (message) => {
        const wallet_list = await walletModel.find({ chat_id: message.chat.id });
        let tableData = wallet_list.map((wallet) => [wallet.public_key, "[" + wallet.secret_key + "]"]);
        tableData.unshift(["Address", "Secret Key"]);
        // Create table string
        const tableString = createTxtTable(tableData);
        const filePath = './wallet_list.txt'; // Path to the file on the bot's server
        fs.writeFile(filePath, tableString, (err) => {
            if (err) {
                console.error('Error creating text file:', err);
                return;
            }
            bot.sendDocument(message.chat.id, filePath, {}, { filename: 'wallet_list.txt' })
                .catch((error) => {
                    console.error('Error sending file:', error.message);
                });
        });
    },
    goToBuySellSelect: async (message) => {
        botProgram.bot_state = BOT_STATE.BUY_SELL_SELECT;
        const text = "\t\t🎩 BUY or SELL?";
        const inlineButtons = [
            [{ text: '💎 BUY', callback_data: 'buy' }, { text: '💶 SELL', callback_data: 'sell' }],
            [{ text: '👈 BACk', callback_data: 'back' }]
        ];
        await customEditMessage(bot, message, text, inlineButtons);
        return;
    },
    goToCoinSelect: async (message, transaction_type) => {
        botProgram.transaction_type = transaction_type;
        botProgram.bot_state = BOT_STATE.COIN_SELECT;
        const text = "\t\t ✍ Insert the  ❄Address❄  of coin to " + transaction_type;
        const inlineButtons = [[{ text: '👈 BACk', callback_data: 'back' }]];
        await customEditMessage(bot, message, text, inlineButtons);
        return;
    },
    goToDexSelect: async (message) => {
        botProgram.bot_state = BOT_STATE.DEX_SELECT;
        botProgram.coin_address = message.text;

        const text = "\t🎩 Raydium or Jupiter?";
        const inlineButtons = [
            [{ text: '📘 Raydium', callback_data: 'raydium' }, { text: '📗 Jupiter', callback_data: 'jupiter' }, { text: '📙 Orca', callback_data: 'or' }],
            [{ text: '👈 BACk', callback_data: 'back' }]
        ];
        await customSendMessage(bot, message, text, inlineButtons);
        return;
    },
    goToConfirmState: async (message, command) => {
        botProgram.dex = command;

        botProgram.bot_state = BOT_STATE.CONFIRM;
        const text = "❗ Confirm \t\t\n\n📗 DEX SITE\n\t\t\t" + botProgram.dex + "\n\n📊 TRANSACTION TYPE\n\t\t\t" + botProgram.transaction_type + "\n\n💎 COIN ADDRESS to " + botProgram.transaction_type + "\n\t\t\t" + botProgram.coin_address + "\n";
        const inlineButtons = [[{ text: '🟢 YES', callback_data: 'run_transaction' }, { text: '🔴 NO', callback_data: 'go_welcome' }]];

        customEditMessage(bot, message, text, inlineButtons);
        return;
    },
    runTransaction: async (message) => {
        botProgram.bot_state = BOT_STATE.RUN_TRANSACTION;
        let text = "⏳ Please wait a little minute";
        inlineButtons = [[{ text: '✅ CANCLE', callback_data: botProgram.dex }]];
        await customEditMessage(bot, message, text, inlineButtons);

        const dex = botProgram.dex;
        let result;
        if (dex == "raydium") {
            console.log("start swap");
            result = await swapOnRaydium(botProgram.transaction_type, botProgram.coin_address, message.chat.id);
            console.log("end swap");
        }
        else if (dex == "jupiter") {
            console.log("start swap");
            result = await swapOnJupiter.swap(botProgram.transaction_type, botProgram.coin_address, message.chat.id);
            console.log("end swap");
        }
        else if (dex == "orca") {
            console.log("start swap");
            result = await swapOnOrca(botProgram.transaction_type, botProgram.coin_address, message.chat.id);
            console.log("end swap");
        }
        botProgram.goToResultState(message, result);
        return;
    },
    goToResultState: async (message, result) => {
        botProgram.bot_state = BOT_STATE.RESULT;
        let text;
        let inlineButtons;
        if (result && result.success) {
            text = "🎉 " + result.message;
            inlineButtons = [[{ text: '✅ OK', callback_data: 'go_welcome' }]];
        } else {
            text = "❗ " + (result.message || "All transactions failed due to network issues or insufficient balance. Please try again.");
            inlineButtons = [[{ text: '✅ OK', callback_data: 'go_welcome' }, { text: '🔄 RETRY', callback_data: 'run_transaction' }]];
        }
        await customEditMessage(bot, message, text, inlineButtons);
        return;
    },
    swap: async () => {
        let result = await swapOnJupiter.swap("buy", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "6895624667");
        console.log(result);
    },
    handleBackCommand: (message) => {
        switch (botProgram.bot_state) {
            case BOT_STATE.HELP:
                botProgram.goToWelcomeState(message, false);
                return;
            case BOT_STATE.WALLET_MANAGE:
                botProgram.goToWelcomeState(message, false);
                return;
            case BOT_STATE.BUY_SELL_SELECT:
                botProgram.goToWelcomeState(message, false);
                return;
            case BOT_STATE.COIN_SELECT:
                botProgram.goToBuySellSelect(message);
                return;
            case BOT_STATE.DEX_SELECT:
                botProgram.goToCoinSelect(message, botProgram.transaction_type);
        }
        return;
    },
}



module.exports = botProgram;