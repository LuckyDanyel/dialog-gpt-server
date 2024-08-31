import { Injectable, HttpStatus } from '@nestjs/common';
import BaseException from 'src/exceptions/BaseException';
import OpenAI from 'openai';
import DialogService from 'src/services/DialogService';
import ThreadService from 'src/services/ThreadService';
import { DialogDTO, MessageDTO } from 'src/DTO';

@Injectable()
export default class AssistantService {
    constructor(
        private readonly dialogService: DialogService,
        private readonly threadService: ThreadService,
    ) {}

    public async getAnswer(dialog: DialogDTO): Promise<OpenAI.Beta.Threads.Messages.Message[]> {
        const cacheDialog = await this.dialogService.getDialog(dialog);
        let hasAnswersLimited = false;
        let dialogSystemMessage: OpenAI.Beta.Threads.Messages.Message | null = null;
        if(!cacheDialog) throw new BaseException({ error: 'Диалог не был найден', status: HttpStatus.BAD_REQUEST, message: 'getAnswer AssistantService' });
        
        hasAnswersLimited = this.dialogService.checkAnswersLimited(cacheDialog);

        if(hasAnswersLimited) {
            throw new BaseException({ error: 'Количество вопросов превышено', status: HttpStatus.BAD_REQUEST, message: 'getAnswer AssistantService' });
        }

        const answer = await this.threadService.runThread(cacheDialog.threadId);
        const updatedDialog = await this.dialogService.increaseAnswerCount(cacheDialog.id);
        hasAnswersLimited = this.dialogService.checkAnswersLimited(updatedDialog);

        if(hasAnswersLimited) {
            dialogSystemMessage = await this.threadService.sendMessage(cacheDialog.threadId, this.getSystemMessages(), 'assistant');
        }

        return dialogSystemMessage ? [answer, dialogSystemMessage] : [answer];
    }

    public getSystemMessages(): MessageDTO[] {
        return [
            {
                text:`Если у Вас остались вопросы, позвоните администратору +7 (978) 012 80 51 или напишите в whatsapp/telegram. Также Вы можете записаться на прием или консультацию нажав кнопку "Записаться на приём" в правом верхнем углу сайта`,
            }
        ]
    }
}
