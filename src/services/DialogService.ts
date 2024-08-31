import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { v4 } from 'uuid';
import OpenAI from 'openai';
import DialogEntitiy from 'src/entities/DialogEntitiy';
import BaseException from 'src/exceptions/BaseException';
import ThreadService from 'src/services/ThreadService';
import { DialogDTO, DialogSettingsDTO } from 'src/DTO';

@Injectable()
export default class DialogService {

    cacheTime: number;

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly threadService: ThreadService,
    ) {
        const dayMilliseconds = 24 * 60 * 60 * 1000
        this.cacheTime = dayMilliseconds;
    }

    public async createDialog(dialog: DialogDTO): Promise<DialogEntitiy> {
        try {
            const cacheDialog = await this.getDialog(dialog);
            if(cacheDialog) return cacheDialog;

            const threadId = await this.threadService.createThread();
    
            const uuid = v4();

            const newDialog = {
                id: `dialog_${uuid}`,
                threadId: threadId,
                answerCount: 0,
            }

            await this.cacheManager.set(newDialog.id, JSON.stringify(newDialog), this.cacheTime);
            return newDialog;
        } catch (error) {
            throw new BaseException({
                error: 'Service: DialogService method: createDialog',
                message: 'Ошибка создания Диалога',
                status: HttpStatus.BAD_REQUEST,
            })
        }
    }

    public async getDialog(dialog: DialogDTO): Promise<null | DialogEntitiy> {
        try {
            const dialogId = dialog.id;
            
            const cacheDialog = await this.cacheManager.get<string>(dialogId);
            if(cacheDialog) {
                return JSON.parse(cacheDialog);
            }
            return null;
        } catch (error) {
            return null;
        }
    };

    public checkAnswersLimited(dialog: DialogEntitiy): boolean {
        const { answersLimit } = this.getSettings();
        const hasDialogAnswersLimitted = dialog.answerCount >= answersLimit;

        return hasDialogAnswersLimitted;
    }

    public async increaseAnswerCount(dialogId: DialogEntitiy['id']): Promise<DialogEntitiy> {
        try {
            const dialog: string = await this.cacheManager.get(dialogId);
            if(dialog) {
                const parsedDialog: DialogEntitiy = JSON.parse(dialog);
                const updatedDialog: DialogEntitiy = {
                    ...parsedDialog,
                    answerCount: parsedDialog.answerCount + 1,
                }
                await this.cacheManager.set(dialogId, JSON.stringify(updatedDialog), this.cacheTime);

                return updatedDialog;
            }
            throw new BaseException({
                error: 'Service: DialogService method increaseAnswerCount',
                message: 'Диалог не был найден',
                status: HttpStatus.BAD_REQUEST
            })
        } catch (error) {
            throw error;
        }
    }

    public async getDialogMessages(dialog: DialogDTO): Promise<OpenAI.Beta.Threads.Messages.Message[]> {
        const dialogId = dialog.id;
        const cacheDialog: string = await this.cacheManager.get(dialogId);
        if(!cacheDialog) {
            return [];
        }

        const parsedDialog: DialogEntitiy = JSON.parse(cacheDialog);

        return this.threadService.getMessages(parsedDialog.threadId);   
    }

    public getSettings(): DialogSettingsDTO {
        return {
            answersLimit: 10,
        }
    }

    public async sendMessage(dialog: DialogDTO): Promise<{ dialogId: string, message: OpenAI.Beta.Threads.Messages.Message }> {
        try {

            const cacheDialog = await this.createDialog(dialog);
            const message = await this.threadService.sendMessage(cacheDialog.threadId, dialog.messages);
            return {
                message: message,
                dialogId: cacheDialog.id,
            }
        } catch (error) {
            throw error;
        }
    }
}
