import { Controller, HttpStatus, HttpCode, Req, Res, Post, Body, Get } from '@nestjs/common';
import { Request, Response } from 'express';
import OpenAI from 'openai';
import DialogService from 'src/services/DialogService';
import { DialogDTO, DialogSettings } from 'src/DTO';

@Controller('api/dialog')
export default class DialogController {
    constructor(
        private readonly dialogService: DialogService,
    ) {}

    @HttpCode(HttpStatus.OK)
    @Post('/messages')
    public async getMessages(
        @Body() dialog: DialogDTO,
        @Req() request: Request,  
        @Res({ passthrough: true }) response: Response
    ): Promise<OpenAI.Beta.Threads.Messages.Message[]> {
        try {
            const messages = await this.dialogService.getDialogMessages(dialog);
            return messages;   
        } catch (error) {
            response.status(error?.status || 500).send(error);
        }
    }

    @HttpCode(HttpStatus.OK)
    @Post('/send-messages')
    public async sendMessage(
        @Body() dialog: DialogDTO,
        @Req() request: Request,  
        @Res({ passthrough: true }) response: Response
    ): Promise<{ dialogId: string, message: OpenAI.Beta.Threads.Messages.Message }> {
        try {
            const dialogMessages = await this.dialogService.sendMessage(dialog);
            return dialogMessages;   
        } catch (error) {
            response.status(error?.status || 500).send(error);
        }
    }

    @Get('/settings')
    public async getSettings(
        @Res({ passthrough: true }) response: Response
    ): Promise<DialogSettings> {
        try {
            const settings = this.dialogService.getSettings();
            return settings;   
        } catch (error) {
            response.status(error?.status || 500).send(error);
        }
    }
}
