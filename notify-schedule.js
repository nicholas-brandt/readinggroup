import { bash } from "https://deno.land/x/bash/mod.ts";
import Talk from "./Talk.js";
import listConfig from "./listConfig.js";
import { toDate, todayDate, isHolidayZurich } from "./helpers.js";

try {
    const { regular_contributors } = listConfig;

    // find the latest talk by a regular contributor
    const talks_file_path = "./talks.json";
    const _talks = await Deno.readTextFile(talks_file_path);
    const talks = JSON.parse(_talks);
    // sort by latest first
    talks.sort((a, b) => toDate(b.date) - toDate(a.date));
    let next_regular_contributor = 0;
    let schedule_anchor_date = todayDate;
    for (const talk of talks) {
        if (regular_contributors.includes(talk.presenter_mail)) {
            next_regular_contributor = regular_contributors[(regular_contributors.indexOf(talk.presenter_mail) + 1) % regular_contributors.length];
            schedule_anchor_date = toDate(talk.date);
            break;
        }
    }

    // find next regular contributor talk date
    const next_talk_date = new Date(schedule_anchor_date);
    next_talk_date.setDate(schedule_anchor_date.getDate() + 14);
    while (await isHolidayZurich(next_talk_date)) {
        next_talk_date.setDate(next_talk_date.getDate() + 7);
    }
    console.log("next regular talk", next_regular_contributor, next_talk_date);

    // only notify if next talk is less than 6 weeks away
    const ms_per_day = 24 * 60 * 60 * 1000;
    const days_ahead = Math.ceil((next_talk_date - todayDate) / ms_per_day);
    if (days_ahead <= 42) {
        // send mail via cli
        // const command = Talk.toScheduleSWAKSCommands(listConfig.maintainer_address, next_talk_date);
        const command = Talk.toScheduleSWAKSCommands(next_regular_contributor, next_talk_date);
        console.log("command", command);
        await bash(command);
    }
} catch (error) {
    console.error(error);
}