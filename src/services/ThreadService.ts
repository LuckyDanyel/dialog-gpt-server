import { Injectable, HttpStatus } from '@nestjs/common';
import { MessageDTO } from 'src/DTO';
import OpenAI from 'openai';
import BaseException from 'src/exceptions/BaseException';
import OpenAIService from 'src/services/OpenAIService';
import { MessageCreateParams } from 'openai/resources/beta/threads/messages';
import ToolFnService from './ToolFnService';

@Injectable()
export default class ThreadService {
    constructor(
        private readonly openAIService: OpenAIService,
        private readonly toolFnService: ToolFnService,
    ) {}

    public async createThread(): Promise<string> {
        try {
            const openAi = this.openAIService.getClient();
            const result = await openAi.beta.threads.create();
            return result.id;
        } catch (error) {
            throw new BaseException({
                error: 'Service: ThreadService method: createThread',
                message: 'Не удалось создать диалог',
                status: HttpStatus.BAD_REQUEST,
            })
        }
    }

    public async runThread(threadId: string): Promise<OpenAI.Beta.Threads.Messages.Message> {
        try {
            const { OPEN_AI_ASSISTANT_ID } = process.env;
            const openAi = this.openAIService.getClient();
            const streams = openAi.beta.threads.runs.stream(threadId, {
                assistant_id: OPEN_AI_ASSISTANT_ID,
                stream: true,
            });
            let message: OpenAI.Beta.Threads.Messages.Message | null = null;
            
            let messsageRun: OpenAI.Beta.Threads.Run | null = null;
            for await (const stream of streams) {
                if(stream.event === 'thread.run.requires_action') {
                    messsageRun = stream.data;
                }
                if(stream.event === 'thread.message.completed') {
                    message = stream.data;
                }
            }

            if(messsageRun) {
                const messageFromFn = await this.toolFnService.callFunctions(messsageRun.required_action);
                await openAi.beta.threads.runs.cancel(threadId, messsageRun.id);
                const messageInChat = await this.sendMessage(threadId, messageFromFn, 'assistant');
                return messageInChat;
            }

            if(message) {
                return message;
            }
            
            throw new Error();

        } catch (error) {
            throw new BaseException({
                error: 'Service: ThreadService method: runThread',
                message: 'Не удалось получить ответ',
                status: HttpStatus.BAD_REQUEST,
            })
        }
    }

    public async sendMessage(threadId: string, messages: MessageDTO[], role: MessageCreateParams['role'] = 'user' ): Promise<OpenAI.Beta.Threads.Messages.Message> {
        try {
            const openAi = this.openAIService.getClient();
            const result = await openAi.beta.threads.messages.create(threadId, {
                role,
                content: messages.map((question) => ({ type: 'text', text: question.text })),
            });
            return result;
        } catch (error) {
            throw new BaseException({
                error: 'Service: ThreadService method: sendMessage',
                message: 'Не удалось задать вопрос',
                status: HttpStatus.BAD_REQUEST,
            })
        }
    }

    public async getMessages(threadId: string): Promise<OpenAI.Beta.Threads.Messages.Message[]> {
        try { 
            const openAi = this.openAIService.getClient();

            const messages = await openAi.beta.threads.messages.list(threadId);

            return messages.data;
            
        } catch (error) {
            throw new BaseException({
                error: 'Service: ThreadService method: getMessages',
                message: 'Не удалось запросить диалоговые сообщения',
                status: HttpStatus.BAD_REQUEST,
            })
        }
    }
}
