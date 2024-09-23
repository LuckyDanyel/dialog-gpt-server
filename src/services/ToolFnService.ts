import { Injectable } from '@nestjs/common';
import { MessageDTO, ClientDTO } from 'src/DTO';
import OpenAI from 'openai';
import OpenAIService from 'src/services/OpenAIService';
import { ToolFnNames } from 'src/types';
import TelegramService from './TelegramService';


@Injectable()
export default class ToolFnService {
    constructor(
        private readonly openAIService: OpenAIService,
        private readonly telegramService: TelegramService,
    ) {

    }

    public callFunctions(required_action: OpenAI.Beta.Threads.Run.RequiredAction): Promise<boolean> {

        const RecordReceptionToolCall = required_action.submit_tool_outputs.tool_calls.find((toolCall) => {
            const fnName: ToolFnNames = toolCall.function.name as ToolFnNames;
            return fnName === 'get_record_reception';
        });

        if(RecordReceptionToolCall) return this.callRecordReception(RecordReceptionToolCall);

        return Promise.resolve(false);
    }

    private async callRecordReception(toolCall: OpenAI.Beta.Threads.Runs.RequiredActionFunctionToolCall): Promise<boolean> {
        try {
            const client: ClientDTO = JSON.parse(toolCall.function.arguments);
            await this.telegramService.sendMessageAboutRecord(client);
            return true;
        } catch (error) {
            return false;
        }

    }

}
