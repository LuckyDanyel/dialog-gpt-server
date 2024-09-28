import { MessageDTO } from "./MessageDTO"

export interface DialogDTO {
    messages?: MessageDTO[];
    id?: string;
}