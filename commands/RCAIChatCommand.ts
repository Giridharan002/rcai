import {
    IHttp,
    IModify,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import { AppSetting } from "../config/Settings";
import { GenAiStackQueryRequest } from "../lib/RequestChatBot";
import { sendMessage } from "../lib/SendMessage";
import { sendNotification } from "../lib/SendNotification";
import { RCAiChatApp } from "../RcAiApp";
import { createRCModalview } from "../ui/AskRC";

export class RCAIChatCommand implements ISlashCommand {
    public command = "rcai";
    public i18nParamsExample = AppSetting.NAMESPACE + "_SlashCommand_Params";
    public i18nDescription = AppSetting.NAMESPACE + "_SlashCommand_Description";
    public providesPreview = false;

    constructor(private readonly app: RCAiChatApp) {}

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp
    ): Promise<void> {
        const prompt = context.getArguments();
        const room = context.getRoom();
        const sender = context.getSender();
        const threadId = context.getThreadId();

        if (prompt.length == 0) {
            var askChatGPT_Modal = createRCModalview(
                modify,
                room,
                undefined,
                threadId
            );
            const triggerId = context.getTriggerId();
            if (!triggerId) {
                return this.app.getLogger().error("TRIGGER UNDEFINED");
            }
            return modify
                .getUiController()
                .openModalView(askChatGPT_Modal, { triggerId }, sender);
        } else {
            const prompt_sentence = prompt.join(" ");
            const payload = prompt_sentence;
            const result = await GenAiStackQueryRequest(
                this.app,
                http,
                read,
                payload,
                sender
            );
            if (result.success) {
                var before_message = `**Prompt**: ${prompt_sentence}`;
                var markdown_message =
                    before_message + result.content.choices[0].message.content;
                sendMessage(
                    modify,
                    room,
                    markdown_message,
                    undefined,
                    context.getThreadId()
                );
            } else {
                sendNotification(
                    modify,
                    room,
                    sender,
                    `**Error!** Could not Request Completion:\n\n` +
                        result.content.error.message
                );
            }
        }
    }
}
