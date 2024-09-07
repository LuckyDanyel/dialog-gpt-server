import { Injectable } from '@nestjs/common';
import { ClientDTO } from 'src/DTO';
import OpenAIService from 'src/services/OpenAIService';
import * as fs from 'fs';
import * as TelegramBot from 'node-telegram-bot-api';


@Injectable()
export default class TelegramService {
    static bot: TelegramBot;

    constructor(private readonly openAIService: OpenAIService) {
        TelegramService.bot = new TelegramBot(process.env.BOT_TOKEN, {polling: true});
        TelegramService.bot.on('my_chat_member', (msg) => {
            
            if(msg.new_chat_member.status === 'member' || msg.new_chat_member.status === 'administrator') {
                fs.writeFileSync('./telegram-data.txt', String(msg.chat.id));
            }
            if(msg.new_chat_member.status === 'kicked' || msg.new_chat_member.status === 'left') {
                fs.writeFileSync('./telegram-data.txt', '');
            }
        });
    }

    private getChatId(): number {
        return Number(fs.readFileSync('./telegram-data.txt'));
    }

    async sendMessageAboutRecord(client: ClientDTO): Promise<void> {
        try {
            const text = ` ------Заявка-----\n Имя: ${client.name}, Номер телефона: ${client.phone}`
            await TelegramService.bot.sendMessage(this.getChatId(), text);   
        } catch (error) {
            throw error;
        }
    }

}
