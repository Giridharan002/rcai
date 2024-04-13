import {
    ISetting,
    SettingType,
} from "@rocket.chat/apps-engine/definition/settings";

export enum AppSetting {
    NAMESPACE = "RCAI",
    GENAI_STACK_API_URL = "http://localhost:8504/query-stream?text=hello&rag=true"
}