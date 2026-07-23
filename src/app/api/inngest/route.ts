import { serve } from "inngest/next";

import { abandonedCartReminder } from "#utils/queue/abandoned-cart";
import { birthdayOffer } from "#utils/queue/birthday-offer";
import { dailySettlement } from "#utils/queue/daily-settlement";
import { inngest } from "#utils/queue/inngest-client";
import { notificationDispatcher } from "#utils/queue/notification-dispatcher";
import { weeklyDigest } from "#utils/queue/weekly-digest";

export const runtime = "nodejs";

const handler = serve({
        client: inngest,
        functions: [notificationDispatcher, abandonedCartReminder, dailySettlement, birthdayOffer, weeklyDigest],
});

export const GET = handler;
export const POST = handler;
export const PUT = handler;
