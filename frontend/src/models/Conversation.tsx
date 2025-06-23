import {MessageModel} from "./MessageModel";
import {UserModel} from "./UserModel";

export interface ConversationModel {
    id: string;
    name: string;
    last_message: MessageModel | null;
    other_user: UserModel;
}
