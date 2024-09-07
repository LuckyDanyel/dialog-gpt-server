import { FunctionTool } from 'openai/resources/beta/assistants';

export type ToolFnNames = "get_record_reception";

export interface FunctionToolCustom extends FunctionTool {
    function: {
        name: ToolFnNames,
        description?: FunctionTool['function']['description'],
        parameters?: FunctionTool['function']['parameters'],
        strict: boolean,
    },
    type: FunctionTool['type'],
}