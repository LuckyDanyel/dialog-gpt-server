import { Controller, Post, HttpStatus, HttpCode, Req, Res, Body, Get, Query } from '@nestjs/common';
import { Request, Response } from 'express';
import AssistantService from 'src/services/AssistantService';
import OpenAI from 'openai';
import OpenAIService from 'src/services/OpenAIService';
import { DialogDTO } from 'src/DTO';

@Controller('api/assistant')
export default class AssistantController {
    constructor(
        private readonly assistantService: AssistantService,
        private readonly openAIService: OpenAIService,
    ) {}

    @HttpCode(HttpStatus.OK)
    @Post('/answer')
    public async getAnswer(
        @Body() dialog: DialogDTO,
        @Req() request: Request, 
        @Res({ passthrough: true }) response: Response
    ): Promise<OpenAI.Beta.Threads.Messages.Message[]> {
        try {
            const answer = await this.assistantService.getAnswer(dialog);
            return answer;
        } catch (error: any) {
            response.status(error?.status || 500).send(error);
        }
    }
}
