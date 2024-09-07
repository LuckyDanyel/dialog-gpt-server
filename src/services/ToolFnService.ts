import { Injectable } from '@nestjs/common';
import { MessageDTO, ClientDTO } from 'src/DTO';
import OpenAI from 'openai';
import OpenAIService from 'src/services/OpenAIService';
import { FunctionToolCustom, ToolFnNames } from 'src/types';
import TelegramService from './TelegramService';


@Injectable()
export default class ToolFnService {
    constructor(
        private readonly openAIService: OpenAIService,
        private readonly telegramService: TelegramService,
    ) {

    }

    public callFunctions(required_action: OpenAI.Beta.Threads.Run.RequiredAction): Promise<MessageDTO[]> {

        const RecordReceptionToolCall = required_action.submit_tool_outputs.tool_calls.find((toolCall) => {
            const fnName: ToolFnNames = toolCall.function.name as ToolFnNames;
            return fnName === 'get_record_reception';
        });

        if(RecordReceptionToolCall) return this.callRecordReception(RecordReceptionToolCall);

        return Promise.resolve([]);
    }

    public getFunctions(): FunctionToolCustom[] {
        return [
            {
                type: 'function',
                function: {
                    name: 'get_record_reception',
                    description: 'Пользователь желает записаться на прием',
                    strict: true,
                    parameters: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "Имя клиента",
                            },
                            phone: {
                                type: "string",
                                description: "Номер телефона клиента",
                            },
                        },
                        required: ["name", "phone"],
                        additionalProperties: false,
                    }
                }
            }
        ]
    }

    private async callRecordReception(toolCall: OpenAI.Beta.Threads.Runs.RequiredActionFunctionToolCall): Promise<MessageDTO[]> {
        try {
            const client: ClientDTO = JSON.parse(toolCall.function.arguments);
            await this.telegramService.sendMessageAboutRecord(client);
            return [{ text: 'Вы записаны на прием. Администратор с вами свяжется для подтверждения записи',  }]
        } catch (error) {
            return [{ text: 'Ошибка записи на прием'}]
        }

    }

}
