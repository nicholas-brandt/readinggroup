import { bash } from "https://deno.land/x/bash/mod.ts";
import Talk from "./Talk.js";
import {
    todayDate
} from "./helpers.js";
import listConfig from "./listConfig.js";

try {
    const talks_file_path = "./talks.json";
    const _talks = await Deno.readTextFile(talks_file_path);
    const talks = JSON.parse(_talks);
    let next_talks = [];
    let days_to_next_date = Infinity;
    for (const _talk of talks) {
        const talk = new Talk(_talk);
        const days_to_date = (talk.date - todayDate) / (24 * 60 * 60 * 1000);
        if (days_to_date < days_to_next_date && days_to_date >= 0) {
            // earlier talk
            next_talks = [talk];
            days_to_next_date = days_to_date;
        } else if (days_to_date == days_to_next_date) {
            // talk on same day
            next_talks.push(talk);
        }
    }
    await Promise.all(next_talks.map(async (talk, _index) => {
        console.log("days to date", (talk.date - todayDate) / (24 * 60 * 60 * 1000));
        console.log("should send", talk.shouldSendNotificationMail());
        try {
            // send mail via cli
            const command = talk.toNotificationSWAKSCommand(listConfig.maintainer_address);
            console.log("command", command);
            await bash(command);
        } catch (error) {
            console.warn("failed to process talk", error);
        }
    }
    ));
} catch (error) {
    console.error(error);
}