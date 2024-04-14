import {
    IHttp,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { AppSetting } from "../config/Settings";
import { RCAiChatApp } from "../RcAiApp";

export async function GenAiStackQueryRequest(
    app: RCAiChatApp,
    http: IHttp,
    read: IRead,
    question: string,
    sender: IUser
): Promise<any> {
    // Assuming you have a setting for the GenAI stack API URL
    const { value: GENAI_STACK_API_URL } = await read
        .getEnvironmentReader()
        .getSettings()
        .getById(AppSetting.GENAI_STACK_API_URL);

    // Encode the question to be URL safe
    const encodedQuestion = encodeURIComponent(question);

    // Prepare the URL with query parameters
    const url = `${GENAI_STACK_API_URL}/query?text=${encodedQuestion}&rag=false`;

    // Make the HTTP GET request to the GenAI stack's query endpoint
    return http
        .get(url)
        .then((response) => {
            var result = {
                success: true,
                question: question,
                content: response.data,
                user: sender.id,
            };
            if ("error" in response.data) {
                result["success"] = false;
                result["content"]["error"]["message"] = response.data["error"]["message"];
            }
            app.getLogger().info(
                `Received response from GenAI stack`,
                result,
                `for the question`,
                question
            );
            return result;
        })
        .catch((error) => {
            app.getLogger().error(
                `Error while querying GenAI stack for question ${question}: `,
                error
            );
            return { success: false };
        });
}