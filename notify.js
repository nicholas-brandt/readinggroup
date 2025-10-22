import { bash } from "https://deno.land/x/bash/mod.ts";
import Talk from "./Talk.js";
import listConfig from "./listConfig.js";

try {
    const talks_file_path = "./talks.json";
    const _talks = await Deno.readTextFile(talks_file_path);
    const talks = JSON.parse(_talks);
    await Promise.all(talks.map(async (_talk, _index) => {
        const talk = new Talk(_talk);
        try {
            if (talk.shouldSendNotificationMail()) {
                // send mail via cli
                const command = talk.toNotificationSWAKSCommand(listConfig.list_address);
                console.log("command", command);
                await bash(command);
            }
        } catch (error) {
            console.warn("failed to process talk", error);
        }
    }
    ));
} catch (error) {
    console.error(error);
}