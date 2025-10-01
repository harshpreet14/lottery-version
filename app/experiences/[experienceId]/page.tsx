import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { getAllActiveMembers, type WhopMembership } from "@/lib/memberships";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	// The headers contains the user token
	const headersList = await headers();

	// The experienceId is a path param
	const { experienceId } = await params;

	// The user token is in the headers
	const { userId } = await whopSdk.verifyUserToken(headersList);

    const result = await whopSdk.access.checkIfUserHasAccessToExperience({
		userId,
		experienceId,
	});

	const user = await whopSdk.users.getUser({ userId });
	const experience = await whopSdk.experiences.getExperience({ experienceId });

	// Either: 'admin' | 'customer' | 'no_access';
	// 'admin' means the user is an admin of the whop, such as an owner or moderator
	// 'customer' means the user is a common member in this whop
	// 'no_access' means the user does not have access to the whop
	const { accessLevel } = result;

    // Also fetch active members list using shared util (by product ID)
    const productId = process.env.WHOP_PRODUCT_ID;
    let members: WhopMembership[] = [];
    if (productId) {
        members = await getAllActiveMembers(productId);
    }

    return (
        <main className="min-h-screen px-8 py-12">
            <div className="max-w-5xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold">
                        Experience: <span className="text-accent-9">{experience.name}</span>
                    </h1>
                    <p className="text-sm text-gray-6 mt-2">
                        Hi <strong>{user.name}</strong>, you {result.hasAccess ? "have" : "do not have"} access. Access level: <strong>{accessLevel}</strong>
                    </p>
                </div>

                <section className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Active App Users</h2>
                        <span className="text-sm text-gray-500">{members.length} total</span>
                    </div>

                    {!productId ? (
                        <div className="bg-amber-50 border border-amber-200 rounded p-4">
                            <p className="text-amber-800 text-sm">Set WHOP_PRODUCT_ID to view users.</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {members.length > 0 ? (
                                members.map((member) => (
                                    <div key={member.id} className="rounded border bg-gray-50 p-4">
                                        <div className="flex items-center gap-3">
                                            {member.customer.profile_pic_url_64 ? (
                                                <img
                                                    src={member.customer.profile_pic_url_64}
                                                    alt={member.customer.name ?? "User"}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-300 grid place-items-center">
                                                    <span className="text-gray-700 text-sm">
                                                        {member.customer.name?.charAt(0) || "?"}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {member.customer.name || "No name"}
                                                </p>
                                                <p className="text-xs text-gray-600 truncate">
                                                    @{member.customer.username || "unknown"} · {member.customer.email || "no email"}
                                                </p>
                                            </div>
                                            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
                                                {member.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-600">No active users found.</p>
                            )}
                        </div>
                    )}
                </section>

                {process.env.NODE_ENV === "development" && (
                    <div className="mt-6 text-xs text-gray-500">
                        <p>User ID: {userId}</p>
                        <p>Experience ID: {experienceId}</p>
                        <p>Product ID: {productId || "Not set"}</p>
                    </div>
                )}
            </div>
        </main>
    );
}
