import {
    toDate,
    getLatestWorkdayBeforeDate,
    isTodayWeekend,
    toICSString,
    todayDate,
    formatTitle,
    formatURL,
    formatAbstract,
    esc
} from "./helpers.js";
import listConfig from "./listConfig.js";
import fqdn from "./fqdn.js";

export default class Talk {
    #talk;
    date;
    constructor(talk) {
        this.#talk = talk;
        this.date = toDate(talk.date);
    }
    get reminderMailContent() {
        const notification_date = getLatestWorkdayBeforeDate(this.date);
        return esc`Dear ${this.#talk.presenter},

This is gentle reminder that your next talk in the reading group has been scheduled for ${this.date.toDateString()}.
Unfortunately, the title (and possibly abstract) is still missing in the reading group repo.
You may update the title and/or abstract at {{link}}.

A notification mail ${notification_date.getTime() >= todayDate.getTime() ? "will be" : "was"} sent on ${notification_date.toDateString()} at 2 PM.
    
Best regards,
Your 📖🤝📧🤖`;
    }
    get reminderMailSubject() {
        return esc`Missing title/abstract: Reading Group - ${this.#talk.date}`;
    }
    shouldSendReminderMail() {
        const days_to_date = (this.date - todayDate) / (24 * 60 * 60 * 1000);
        // remind every second day if title or abstract is missing
        return !isTodayWeekend() && days_to_date >= 0 && days_to_date < 11 && !this.#talk.title && this.#talk.presenterMailAddress != "";
    }
    toReminderSWAKSCommand() {
        const options = [
            esc`--to ${this.presenterMailAddress}`,
            esc`--cc ${listConfig.maintainer_address}`,
            esc`--from ${listConfig.bot_address}`,
            esc`--header "Subject: ${this.reminderMailSubject}"`,
        ];
        for (const [key, value] of Object.entries(listConfig.headers)) {
            options.push(esc`--header '${key}: ${value}'`);
        }
        options.push(esc`--body "${this.reminderMailContent}"`);
        return 'swaks ' + options.join(' ');
    }
    get presenterMailAddress() {
        if (typeof this.#talk.presenter_mail === 'string') {
            return this.#talk.presenter_mail;
        }
        throw new Error('recipient mail address is invalid');
    }
    get notificationMailContent() {
        const {
            presenter,
            title,
            abstract,
            time,
            room,
            url
        } = this.#talk;
        return esc`Hi all,

On ${this.date.toDateString()}, at ${time} ${presenter} will give a talk in ${room} about: ${formatTitle(title)}.
${formatURL(url)}
${formatAbstract(abstract)}
Best regards,
Your 📖🤝📧🤖

---------------------------------------------
Zoom room: {{zoom_link}}`;
    }
    get notificationMailSubject() {
        return esc`Reading Group - ${this.date.toDateString()}`;
    }
    get notificationEventSubject() {
        return esc`Reading Group - ${this.#talk.presenter}`;
    }
    shouldSendNotificationMail() {
        return getLatestWorkdayBeforeDate(this.date).getTime() == todayDate.getTime();
    }
    toNotificationSWAKSCommand(list_address) {
        const options = [
            esc`--to ${list_address}`,
            esc`--from ${listConfig.bot_address}`,
            esc`--ehlo ${fqdn}`,
            `--header 'Subject: ${this.notificationMailSubject}'`
        ];
        for (const [key, value] of Object.entries(listConfig.headers)) {
            options.push(esc`--header '${key}: ${value}'`);
        }
        // create and attach ICS file
        const ics_content = toICSString(this.notificationEventSubject, this.#talk.date, this.#talk.time);
        options.push(
            esc`--attach-type text/plain`,
            `--attach-body "${this.notificationMailContent}"`,
            esc`--attach-type text/calendar`,
            esc`--attach-name 'readingroup-talk.ics'`,
            `--attach "${ics_content}"`,
        );
        return `swaks ${options.join(' ')}`;
    }
    static toScheduleSWAKSCommands(presenter_mail, date) {
        const options = [
            esc`--to ${presenter_mail}`,
            esc`--cc ${listConfig.maintainer_address}`,
            esc`--from ${listConfig.bot_address}`,
            esc`--header "Subject: Reading Group  - Schedule"`,
        ];
        for (const [key, value] of Object.entries(listConfig.headers)) {
            options.push(esc`--header '${key}: ${value}'`);
        }
        const mail_body = esc`Dear Presenter,

According to the current schedule, your next talk in the reading group is (tentatively) scheduled for ${date.toDateString()}.
Please check the "talks.json" file at {{link}} to enter your talk details.

(Note that the reading group bot is not smart enough to detect whether you have switched with someone else, or if your lexicographically preceeding contributor has just given an irregular talk.)

Best regards,
Your 📖🤝📧🤖`;
        options.push(esc`--body "${mail_body}"`);
        return 'swaks ' + options.join(' ');
    }
};