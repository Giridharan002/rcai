import {
    IAppAccessors,
    IConfigurationExtend,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import {
    IMessage,
    IPostMessageSent,
} from "@rocket.chat/apps-engine/definition/messages";
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";
import { RoomType } from "@rocket.chat/apps-engine/definition/rooms";
import {
    IUIKitResponse,
    UIKitActionButtonInteractionContext,
    UIKitViewSubmitInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { RCAIChatCommand } from "./commands/RCAIChatCommand";
import { buttons } from "./config/Buttons";
import { GenAiStackQueryRequest } from "./lib/RequestChatBot";
import { sendDirect } from "./lib/SendDirect";
import { sendMessage } from "./lib/SendMessage";
import { sendNotification } from "./lib/SendNotification";
import { ActionButtonHandler } from "./handlers/ActionButtonHandler";
import { ViewSubmitHandler } from "./handlers/ViewSubmit";

export class RCAiChatApp extends App implements IPostMessageSent {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async extendConfiguration(configuration: IConfigurationExtend) {
        await configuration.slashCommands.provideSlashCommand(
            new RCAIChatCommand(this)
        );
        await Promise.all(
            buttons.map((button) => configuration.ui.registerButton(button))
        );
    }

    public async executeActionButtonHandler(
        context: UIKitActionButtonInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<IUIKitResponse> {
        return new ActionButtonHandler().executor(
            context,
            read,
            http,
            persistence,
            modify,
            this.getLogger()
        );
    }

    public async executeViewSubmitHandler(
        context: UIKitViewSubmitInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ) {
        return new ViewSubmitHandler().executor(
            this,
            context,
            read,
            http,
            persistence,
            modify,
            this.getLogger()
        );
    }

    public async executePostMessageSent(
        message: IMessage,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<void> {
        const { text, room, sender } = message;
        var bot_user = await read.getUserReader().getAppUser();
        if (
            bot_user &&
            message.room.type == RoomType.DIRECT_MESSAGE &&
            message.room.userIds?.includes(bot_user?.id) &&
            bot_user?.id !== sender.id
        ) {
            // Check if text is defined before proceeding
            if (text) {
                const result = await GenAiStackQueryRequest(
                    this,
                    http,
                    read,
                    text, // Now TypeScript knows text is a string
                    sender
                );
                if (result.success) {
                    var markdown_message = result.content.choices[0].message.content;
                    sendDirect(sender, read, modify, markdown_message);
                } else {
                    sendNotification(
                        modify,
                        room,
                        sender,
                        `**Error!** Could not Request Completion:\n\n` +
                            result.content.error.message
                    );
                }
            } else {
                // Handle the case where text is undefined
                // For example, you might want to log an error or send a notification
                this.getLogger().error('Message text is undefined');
            }
        }

        return;
    }
}
