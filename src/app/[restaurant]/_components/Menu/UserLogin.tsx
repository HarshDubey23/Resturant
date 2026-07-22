import { usePathname, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Textfield } from "xtreme-ui";

const mobileNumberPattern = /^(\+91[-\s]?)?[6-9]\d{9}$/;
const RESEND_COOLDOWN = 30;

const UserLogin = ({ setOpen }: UserLoginProps) => {
	const pathname = usePathname();
	const params = useSearchParams();
	const [page, setPage] = useState("phone");
	const [buttonLabel, setButtonLabel] = useState("Next");
	const [busy, setBusy] = useState(false);

	const [dialCode] = useState("91");
	const [phone, setPhone] = useState("");
	const [otp, setOtp] = useState("");
	const [otpSent, setOtpSent] = useState(false);
	const [resendCooldown, setResendCooldown] = useState(0);

	const [fname, setFName] = useState("");
	const [lname, setLName] = useState("");
	const [heading, setHeading] = useState(["Let's", " start ordering"]);

	const phoneNumber = `+${dialCode}${phone}`;
	const restaurant = pathname.replaceAll("/", "");
	const table = params.get("table") || "";

	const sendOtp = async () => {
		setBusy(true);
		try {
			const res = await fetch("/api/auth/send-otp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ restaurant, phone: phoneNumber }),
			});
			const data = await res.json();
			if (!res.ok) {
				toast.error(data?.message || "Failed to send OTP");
				setBusy(false);
				return;
			}
			setOtpSent(true);
			setResendCooldown(RESEND_COOLDOWN);
			if (data.debugOtp) {
				toast.info(`Dev OTP: ${data.debugOtp}`);
			} else {
				toast.success("OTP sent to your phone");
			}
		} catch {
			toast.error("Failed to send OTP");
		}
		setBusy(false);
	};

	const verifyOtpAndSignIn = async () => {
		if (!table) return toast.error("Please scan the QR Code");
		if (!otp) return toast.error("Please enter the OTP");

		setBusy(true);
		try {
			const res = await fetch("/api/auth/verify-otp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ restaurant, phone: phoneNumber, otp, table }),
			});
			const data = await res.json();
			if (!res.ok) {
				toast.error(data?.message || "OTP verification failed");
				setBusy(false);
				return;
			}

			const signInRes = await signIn("customer", {
				redirect: false,
				restaurant,
				phone: phoneNumber,
				fname: data.customer?.fname || fname,
				lname: data.customer?.lname || lname,
				table,
				verificationToken: data.verificationToken,
				callbackUrl: `${window.location.origin}`,
			});

			if (signInRes?.error) {
				toast.error(signInRes.error);
			}
			setOpen(false);
		} catch {
			toast.error("Verification failed");
		}
		setBusy(false);
	};

	const onNext = async () => {
		if (page === "phone") {
			if (!mobileNumberPattern.test(phoneNumber)) {
				return toast.error("Please enter a valid phone number");
			}
			setBusy(true);
			setTimeout(() => {
				setBusy(false);
				setPage("signOTP");
				sendOtp();
			}, 400);
		} else if (page === "signOTP" || page === "loginOTP") {
			await verifyOtpAndSignIn();
		}
	};

	const handleResendOtp = () => {
		if (resendCooldown > 0) return;
		sendOtp();
	};

	useEffect(() => {
		if (page === "phone") {
			setHeading(["Let's", " start ordering"]);
			setButtonLabel("Next");
		} else if (page === "signOTP") {
			setHeading(["Glad to", " see you here"]);
			setButtonLabel("Verify OTP");
		} else if (page === "loginOTP") {
			setHeading(["Welcome", " back User"]);
			setButtonLabel("Verify OTP");
		}
	}, [page]);

	useEffect(() => {
		if (resendCooldown <= 0) return;
		const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
		return () => clearInterval(timer);
	}, [resendCooldown]);

	return (
		<div className={`userLogin ${page}`}>
			<div className="header">
				<span className="heading">
					<span>{heading[0]}</span>
					{heading[1]}
				</span>
			</div>
			<div className="content">
				<Textfield
					id="user-login-phone"
					className="phone"
					type="phone"
					autoComplete="tel-local"
					value={phone}
					onEnterKey={onNext}
					onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
				/>
				<div className="otpContainer">
					{page === "phone" ? (
						<>
							<Textfield
								id="user-login-fname"
								className="fName"
								placeholder="First Name"
								autoComplete="given-name"
								value={fname}
								onChange={(e: ChangeEvent<HTMLInputElement>) => setFName(e.target.value)}
							/>
							<Textfield
								id="user-login-lname"
								className="lName"
								placeholder="Last Name"
								autoComplete="family-name"
								onEnterKey={onNext}
								value={lname}
								onChange={(e: ChangeEvent<HTMLInputElement>) => setLName(e.target.value)}
							/>
						</>
					) : (
						<>
							<Textfield
								className="otp"
								placeholder="Enter OTP"
								autoComplete="one-time-code"
								value={otp}
								onChange={(e: ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
							/>
							{otpSent && (
								<button
									type="button"
									onClick={handleResendOtp}
									disabled={resendCooldown > 0}
									className="text-sm text-purple-600 hover:text-purple-700 disabled:text-gray-400 mt-2">
									{resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
								</button>
							)}
						</>
					)}
				</div>
			</div>
			<div className="footer">
				<button
					onClick={onNext}
					disabled={busy}
					className="px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50">
					{busy ? "Loading..." : buttonLabel}
				</button>
			</div>
		</div>
	);
};

export default UserLogin;

type UserLoginProps = {
	setOpen: (open: boolean) => void;
};
