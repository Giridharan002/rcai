import {
    IHttp,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { AppSetting } from "../config/Settings";
import { RCAiChatApp } from "../RcAIApp";

export async function GenAiStackRequest(
    app: RCAiChatApp,
    http: IHttp,
    read: IRead,
    question: any,
    sender: IUser
): Promise<any> {
    // Assuming you have a setting for the API URL
    const { value: GENAI_STACK_API_URL } = await read
        .getEnvironmentReader()
        .getSettings()
        .getById(AppSetting.GENAI_STACK_API_URL);

    // Prepare the request payload
    const payload = {
        question: question,
        rag : true,
    };

    // Make the HTTP request
    return http
        .post(GENAI_STACK_API_URL, {
            data: payload,
        })
        .then((response) => {
            var result = {
                success: true,
                question: question,
                content: response.data,
                user: sender.id,
            };
            if ("error" in response.data) {
                result["success"] = false;
                result["content"]["error"]["message"] = result["content"]["error"]["message"].replace("api-keys.", "api-keys");
            }
            app.getLogger().info(
                `Got new completion`,
                result,
                `for the payload`,
                payload
            );
            return result;
        })
        .catch((error) => {
            app.getLogger().error(
                `Error while getting new completion for question ${question}: `,
                error
            );
            return { success: false };
        });
}