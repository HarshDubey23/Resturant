import mongoose, { type HydratedDocument } from "mongoose";

const gender = ["male", "female", "others"] as const;
const customerSource = ["qr", "aggregator", "direct"] as const;

const CustomerSchema = new mongoose.Schema<TCustomer>(
        {
                fname: { type: String, trim: true, required: true },
                lname: { type: String, trim: true, required: true },
                phone: { type: String, trim: true, required: true, sparse: true },
                email: { type: String, trim: true, sparse: true },
                gender: { type: String, trim: true, lowercase: true, enum: gender },
                whatsappOptIn: { type: Boolean, default: false },
                restaurantID: { type: String, trim: true, lowercase: true, required: true },
                /** Phase 3 — Commission Saver. `source` distinguishes aggregator-acquired
                 *  customers (eligible for the direct-order WhatsApp offer) from customers
                 *  who already order direct (NOT eligible). `null`/unset = unknown, treated
                 *  as eligible by `/api/internal/customer/eligibility` so existing rows
                 *  can be re-engaged without a migration. */
                source: { type: String, trim: true, lowercase: true, enum: customerSource },
                firstSeenAt: { type: Date, default: Date.now, index: true },
                lastOrderAt: { type: Date, index: true },
                /** UPI Autodebit mandate (Razorpay recurring). Populated by the
                 * payment webhook when the ₹1 auth payment succeeds. */
                upiMandate: {
                        mandateId: { type: String, trim: true },
                        status: { type: String, trim: true, enum: ["created", "active", "paused", "revoked"], default: null },
                        vpa: { type: String, trim: true },
                        createdAt: { type: Date },
                },
        },
        { timestamps: true },
);

CustomerSchema.index({ phone: 1, restaurantID: 1 }, { unique: true });
// Email uniqueness is scoped per restaurant — the same person may be a
// customer of many restaurants on the platform. A global unique index here
// rejected legitimate sign-ups at a second restaurant.
CustomerSchema.index({ email: 1, restaurantID: 1 }, { unique: true, sparse: true });

export const Customers = mongoose.models?.customers ?? mongoose.model<TCustomer>("customers", CustomerSchema);
export type TCustomer = HydratedDocument<{
        fname: string;
        lname: string;
        gender: (typeof gender)[number];
        phone: string;
        email: string;
        whatsappOptIn: boolean;
        restaurantID: string;
        source?: (typeof customerSource)[number];
        firstSeenAt?: Date;
        lastOrderAt?: Date;
        upiMandate?: {
                mandateId?: string;
                status?: "created" | "active" | "paused" | "revoked" | null;
                vpa?: string;
                createdAt?: Date;
        };
}>;
