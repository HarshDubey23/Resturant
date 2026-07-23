import { Inngest } from "inngest";

export const inngest = new Inngest({
	id: "orderworder",
	eventKey: process.env.INNGEST_EVENT_KEY,
});
